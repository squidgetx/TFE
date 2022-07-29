import argparse
import pprint
from requests_oauthlib import OAuth1
import requests
import datetime as dt
import pandas as pd
import os
import re
from time import sleep

BEARER_TOKEN = os.environ["BEARER_TOKEN"]
PERSONAL_TOKEN = os.environ["PERSONAL_TOKEN"]
PERSONAL_SECRET = os.environ["PERSONAL_SECRET"]
APP_TOKEN = os.environ["TWITTER_API_KEY"]
APP_SECRET = os.environ["TWITTER_API_SECRET"]
FOX_ID = "1367531"
SLEEP_TIME = 0.5

MESSAGE = "Hi! I'm a graduate student running a research project on news and social media. I'm messaging you because you follow a large U.S. news publisher on Twitter and I'm interested in learning more about your experience. If you'd be willing to fill out a quick five minute survey for me that would be incredibly useful. The link is here: https://nyu.qualtrics.com/jfe/form/SV_1CgFQ9CiUrT2JXE. Thanks in advance!"


def get_follower_query(account_id, token):
    query = (
        f"https://api.twitter.com/2/users/{account_id}/followers?user.fields=verified"
    )
    if token:
        query += "&pagination_token=" + token
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
        delay = pow(2, backoff) * 5
        print(f"(429) hit rate limit... sleeping for {delay}")
        sleep(delay)
        return connect_to_endpoint(url, backoff + 1)
    if response.status_code != 200:
        print(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
        )
        return None
    return response.json()


def parse_followers(data):
    unverified = [d for d in data if d["verified"] == False]

    return unverified


def get_followers(account_id, n):
    token = None
    count = 0
    all_results = []
    while count < n:
        sleep(SLEEP_TIME)  # avoid getting rate limited
        query = get_follower_query(account_id, token)
        results = connect_to_endpoint(query)
        if results == None:
            continue
        meta = results["meta"]
        count += meta["result_count"]
        token = meta.get("next_token")
        if "data" in results:
            all_results.extend(parse_followers(results["data"]))
        else:
            print(results)
        if not token:
            break
    return all_results


def send_dm(recipient_id, message, auth):
    url = "https://api.twitter.com/1.1/direct_messages/events/new.json"
    event_object = {
        "event": {
            "type": "message_create",
            "message_create": {
                "target": {
                    "recipient_id": recipient_id,
                },
                "message_data": {
                    "text": message,
                },
            },
        }
    }
    response = requests.post(url, json=event_object, auth=auth)
    return response


if __name__ == "__main__":
    # results = get_followers(FOX_ID, 200)
    results = [{"id": 448314728}]

    oauth = OAuth1(
        APP_TOKEN,
        client_secret=APP_SECRET,
        resource_owner_key=PERSONAL_TOKEN,
        resource_owner_secret=PERSONAL_SECRET,
    )

    private = 0
    failed = 0
    success = 0
    for user in results:
        user_id = user["id"]
        if False:
            print(f"Sending dm to {user_id}")
            continue
        sleep(SLEEP_TIME)
        response = send_dm(user_id, message=MESSAGE, auth=oauth)
        print(user_id)
        errors = response.json().get("errors", [])
        error_codes = [e.get("code") for e in errors]
        pprint.pp(response.json())
        if 349 in error_codes:
            private += 1
        elif error_codes == []:
            success += 1
        else:
            failed += 1
    print(f"Successfully sent {success} messages.")
    print(f"Failed to send to {private} private accounts.")

    pd.DataFrame.from_records(results).to_csv("messaged_accounts.csv")
