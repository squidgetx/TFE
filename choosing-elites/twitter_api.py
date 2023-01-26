"""
Utility to convert "username" column in a CSV to twitter numeric ID + other metadata
Usage: python3 get_twitter_id.py <infile> <outfile>
"""
import csv
import itertools
import requests
import time
import os
import pandas as pd
import sys

USERNAMES_SEARCH_URL = "https://api.twitter.com/2/users/by"
USERS_SEARCH_URL = "https://api.twitter.com/2/users"
BEARER_TOKEN = os.environ["BEARER_TOKEN"]
BACKUP_TOKEN = os.environ["BACKUP_BEARER_TOKEN"]


def grouper(n, iterable):
    it = iter(iterable)
    while True:
        chunk = tuple(itertools.islice(it, n))
        if not chunk:
            return
        yield chunk


def get_follower_ids_query(id):
    return f"https://api.twitter.com/2/users/{id}/followers?user.fields=id&max_results=1000"


def get_following_ids_query(id):
    return f"https://api.twitter.com/2/users/{id}/following?user.fields=id&max_results=1000"


def get_user_search_query(names):
    query = f"{USERNAMES_SEARCH_URL}?usernames={','.join(names)}&user.fields=id,public_metrics,verified,verified_type,description"
    return query

def get_user_search_query_ids(names):
    query = f"{USERS_SEARCH_URL}?ids={','.join(names)}&user.fields=username,public_metrics,verified,verified_type,description"
    return query

def bearer_oauth(r):
    """
    Method required by bearer token authentication.
    """

    r.headers["Authorization"] = f"Bearer {BEARER_TOKEN}"
    r.headers["User-Agent"] = "v3TweetLookupPython"
    return r


def connect_to_endpoint(url, backoff=0):
    response = requests.request("GET", url, auth=bearer_oauth)
    if response.status_code == 429:
        delay = pow(2, backoff)
        print(f"(429) hit rate limit... sleeping for {delay} min")
        time.sleep(delay * 60)
        return connect_to_endpoint(url, backoff + 1)
    if response.status_code != 200:
        print(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
        )
        return None
    return response.json()


def fetch_user_info(ids, how=get_user_search_query_ids):
    BATCH_SIZE = 100
    results = []
    for id_batch in grouper(BATCH_SIZE, ids):
        response = connect_to_endpoint(how(id_batch))
        # {'data': [{'id': '1209936918', 'name': 'One America News', 'username': 'OANN'}, {'id': '1367531', 'name': 'Fox News', 'username': 'FoxNews'}]}
        data = response.get("data")
        for obj in data:
            obj["followers_count"] = obj["public_metrics"]["followers_count"]
            obj["following_count"] = obj["public_metrics"]["following_count"]
            obj["tweet_count"] = obj["public_metrics"]["tweet_count"]
            obj["listed_count"] = obj["public_metrics"]["listed_count"]
            del obj["public_metrics"]
            results.append(obj)
    return results


def fetch(base_query):
    """
    Fetch results from a twitter API query string.
    Handles pagination and uses exponential backoff when rate limited
    Returns a generator of results
    """

    results = []
    token = None
    while True:
        token_query_string = f"&pagination_token={token}" if token else ""
        response = connect_to_endpoint(base_query + token_query_string)
        if "meta" in response:
            token = response["meta"].get("next_token")
            results.append(response.get("data", []))

            if token is None:
                break
        else:
            break
    return itertools.chain.from_iterable(results)


def fetch_follower_ids(id):
    return [a["id"] for a in fetch(get_follower_ids_query(id))]


def fetch_following_ids(id):
    return [a["id"] for a in fetch(get_following_ids_query(id))]
