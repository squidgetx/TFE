"""
Calculate ideology of a Twitter user using Barbera (2015) method

Current implementation is just lazy interfacing with the R tweetscores package
mostly because I can't figure out how to get the tweetscores package to use
twitter v2 API
"""
import csv
import sys
import os.path as path
import pandas as pd
from twitter_api import fetch_follower_ids, fetch_following_ids


def download_network_for_id(id):
    # followers = fetch_follower_ids(id)
    following = fetch_following_ids(id)

    # with open(f"followers/{id}.csv", "w") as f:
    #    writer = csv.writer(f)
    #    writer.writerow(["id"])
    #    writer.writerows([[id] for id in followers])
    with open(f"following/{id}.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerow(["id"])
        writer.writerows([[id] for id in following])


with open(sys.argv[1]) as infile:
    reader = csv.DictReader(infile, delimiter="\t")
    df = pd.DataFrame.from_records([row for row in reader])
    ids = df["id"]
    for id in ids:
        if path.exists(f"following/{id}.csv"):
            print("skipping ", id)
        elif id:
            print("downloading for ", id)
            download_network_for_id(id)
        else:
            print("id blank")
