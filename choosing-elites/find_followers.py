"""
"""

import csv
import sys
import os.path as path
import pandas as pd
from twitter_api import fetch_user_info, get_user_search_query_ids

ACCOUNTS = [
(14606079,	["propublica"]),
(13493302,	["mmfa", "media matters"]),
(16955991,	["salon"]),
(2836421	,["msnbc"]),
(2467791	,["washingtonpost", "washington post"]),
(807095	,["nytimes", "new york times"]),
#(5392522,	["npr", "national public radio"]),
(14717197,	["tpm", "talking points memo"]),
(39308549,	["dailycaller", "daily caller"]),
(1367531	,["foxnews", "fox"]),
(10774652,	["theblaze" ,"blaze"]),
(14662354,	["washtimes", "washington times"]),
(19553409,	["rasmussen_poll", "rasmussen poll"]),
(19417492,	["nro", "national review"]),
]

results = []

for item in ACCOUNTS:
    id = item[0]
    keywords = item[1]
    with open(f"following/{id}.csv", "r") as f:
        ids = [r['id'] for r in csv.DictReader(f)]
        print(f"{keywords} | {len(ids)}")
        df = pd.DataFrame.from_records(fetch_user_info(ids, get_user_search_query_ids))
        df['seed'] = f"{keywords[0]}"
        #relevant_rows = df['description'].str.lower().str.contains('|'.join(keywords))
        results.append(df)

pd.concat(results).to_csv('followers_unfiltered.tsv', sep='\t')