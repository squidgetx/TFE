#!/usr/bin/env python3
"""
this file takes the downloaded s3 data and converts it to a csv for easier
processing
"""
import pandas as pd
import json
import os

DATA_DIR = "./data_pilot_v2"
OUTFILE = "./formatted_data.tsv"
BLACKLIST_AUTHORS = json.load(open("./blacklist_authors.json", "rt"))["authors"]


def gen_files():
    """
    generator to yield objects downloaded from s3
    """
    for root, dirs, files in os.walk(DATA_DIR):
        for f in files:
            for line in open(os.path.join(root, f), "rt"):
                for obj in process_line(line):
                    yield obj


def process_line(line):
    """
    take a line of input
    """
    if not line.strip():
        return {}
    try:
        decoder = json.JSONDecoder()

        content_length = len(line)
        decode_index = 0
        obj, _ = decoder.raw_decode(line)

        # edge case, turn single uploads into lists
        if not isinstance(obj, list):
            obj = [obj]
        else:
            import pdb

            pdb.set_trace()
        for o in obj:
            o["blacklist_author"] = o.get("author") in BLACKLIST_AUTHORS

        return obj
    except:
        import pdb

        pdb.set_trace()


def data2csv():
    df = pd.DataFrame.from_records(gen_files())
    # drop any completely empty rows (artifacts from parsing)
    df = df.dropna(how="all")
    df.to_csv(OUTFILE, sep="\t")


if __name__ == "__main__":
    data2csv()
