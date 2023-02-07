"""
processes round 2 workers
"""
import re
import argparse
import logging
import json
import boto3
import pandas as pd

CONFIG = json.load(open("./config.json"))

logging.basicConfig(level=logging.INFO)


client = boto3.client("mturk")


def batch(iterable, n):
    l = len(iterable)
    for ndx in range(0, l, n):
        yield iterable[ndx : min(ndx + n, l)]


def get_hit_results(hit_id):
    response = client.list_assignments_for_hit(
        HITId=hit_id,
        MaxResults=100,
        AssignmentStatuses=["Approved"],
    )
    return response["Assignments"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process postsurvey HIT workers.")
    parser.add_argument(
        "name", type=str, help="the config.json name for the HIT to process"
    )

    args = parser.parse_args()

    if args.name == "postsurvey":
        results = get_hit_results("3UQ1LLR27IL52OSSQL1AIJRQJ6QALS")
    else:
        results = get_hit_results(CONFIG[args.name]["pilot_postsurvey_hit_id"])

    df = pd.DataFrame.from_records(results)

    df.to_csv(f"mturk_{args.name}.tsv", sep="\t")
