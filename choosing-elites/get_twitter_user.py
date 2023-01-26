"""
Utility to convert "username" column in a CSV to twitter numeric ID + other metadata
Usage: python3 get_twitter_id.py <infile> <outfile>
"""
import csv
import pandas as pd
import sys
from twitter_api import fetch_user_info, get_user_search_query, get_user_search_query_ids


with open(sys.argv[1]) as infile:
    reader = csv.DictReader(infile, delimiter="\t")
    df = pd.DataFrame.from_records([row for row in reader])
    if ('id' in df):
        results = fetch_user_info(df['id'], how=get_user_search_query_ids)
    elif "username" in df:
        usernames = df["username"]
        results = fetch_user_info(usernames, how=get_user_search_query)
    else:
        print("Error: Neither id nor username column found in input")
        sys.exit()

    records = pd.DataFrame.from_records(results)
    pd.merge(
        df,
        records,
        left_on=df["username"].str.lower(),
        right_on=records["username"].str.lower(),
        how="left",
    ).to_csv(sys.argv[2], sep="\t")
