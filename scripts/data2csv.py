#!/usr/bin/env python3
"""
this file takes the downloaded s3 data and converts it to a csv for easier
processing
"""
import pandas as pd
import json
import os
from tkinter import W

DATA_DIR = "./data"
OUTFILE = "./formatted_data.tsv"


def gen_files():
    """
    generator to yield objects downloaded from s3
    """
    for root, dirs, files in os.walk(DATA_DIR):
        for f in files:
            for line in open(f"{DATA_DIR}/{f}", "rt"):
                for obj in process_line(line):
                    yield obj


def process_line(line):
    """
    take a line of input
    """
    obj = json.loads(line)
    # edge case, turn single uploads into lists
    if not isinstance(obj, list):
        obj = [obj]
    return obj


def data2csv():
    df = pd.DataFrame.from_records(gen_files())
    df.to_csv(OUTFILE, sep="\t")


if __name__ == "__main__":
    data2csv()
