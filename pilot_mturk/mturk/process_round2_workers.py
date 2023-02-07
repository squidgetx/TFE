"""
processes round 2 workers
"""
import re
import argparse
import logging
import json
import boto3
import pandas as pd

DATA_FILE = "formatted_data.tsv"
CONFIG = json.load(open("./config.json"))

logging.basicConfig(level=logging.INFO)


def get_message_text(link):
    return f"""
Thank you for participating in our study and installing the Extension Survey Study web browser extension.

We would like to request that you participate in a follow-up survey. The reward for completing the follow-up survey is $2.

You should be able to find the HIT under the title "Study on Social Media and Politics: Chrome Extension (Second Survey)"

You are free to uninstall the extension at this time.
"""


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
    # TODO: implement pagination, once we have larger HITs
    return response["Assignments"]


def get_twitter_users(results):
    """
    Given the list of HIT results, only return workers that use Twitter
    """
    twitter_survey_df = pd.read_csv("./qualtrics/prescreen.tsv", sep="\t")[
        ["Q7_6", "ResponseID"]
    ]
    df = pd.DataFrame.from_records(results)

    def parseAnswer(answerxml):
        return re.search("FreeText>(.*)</FreeText>", answerxml).group(1)

    df["ResponseID"] = [parseAnswer(a) for a in df["Answer"]]

    # Use inner join to throw out any survey responses not associated with MTurk values and vice versa
    df = df.merge(twitter_survey_df, on="ResponseID", how="inner")
    df = df.loc[
        df["Q7_6"].isin(
            ["Several times a day", "A few days a week", "About once a day"]
        )
    ]
    return df[["AssignmentId", "WorkerId"]].to_records()


def get_worker_installs(results):
    """
    Given a list of HIT results, get the list of workers that actually installed the extension
    """
    df = pd.read_csv(DATA_FILE, sep="\t")
    install_worker_ids = set(df[df["event"] == "install"]["workerID"])
    out = []

    for res in results:
        if res["WorkerId"] in install_worker_ids:
            out.append(res)

    return out


def add_workers_to_qualification(workers, qualification, no_dry):
    for worker in workers:
        logging.info(
            f"Adding worker ID {worker['WorkerId']} to qualification {qualification}"
        )
        if no_dry:
            try:
                client.associate_qualification_with_worker(
                    QualificationTypeId=qualification,
                    IntegerValue=1,
                    SendNotification=False,
                )
            except Exception as e:
                logging.error(
                    f"Error while granting qualification to worker {worker['WorkerId']}: {e}"
                )


def grant_bonus(workers, no_dry):
    for worker in workers:
        logging.info(f"Granting bonus to worker ID {worker['WorkerId']}")
        if no_dry:
            try:
                response = client.send_bonus(
                    WorkerId=worker["WorkerId"],
                    BonusAmount="5",
                    AssignmentId=worker["AssignmentId"],
                    Reason="Thank you for installing the Extension Survey Study web browser extension. Here is your $5 bonus payment! Please watch out for a follow-up invitation to participate in additional HITs",
                    UniqueRequestToken=worker["WorkerId"],
                )
            except Exception as e:
                logging.error(
                    f"Error while granting bonus to worker {worker['WorkerId']}: {e}"
                )


def notify_workers_postsurvey(workers, message_text, no_dry):
    for workers in batch(workers, 100):
        logging.info(f"Notifying worker ID batch")
        if no_dry:
            try:
                response = client.notify_workers(
                    WorkerIds=[worker["WorkerId"] for worker in workers],
                    Subject="Extension Survey Study Follow-up HIT available!",
                    MessageText=message_text,
                )
                if response["NotifyWorkersFailureStatuses"]:
                    logging.error(response)
            except Exception as e:
                logging.error(f"Error while notifying workers: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process postsurvey HIT workers.")
    parser.add_argument(
        "name", type=str, help="the config.json name for the HIT to process"
    )
    parser.add_argument(
        "--no-dry", action="store_true", help="dry run", dest="no_dry", default=False
    )

    args = parser.parse_args()
    if args.no_dry:
        logging.warning("DRY RUN DISABLED, EXECUTING ACTIONS")
        result = input("Type y to continue...")
        if result != "y":
            exit()
    else:
        logging.info("Dry run! No actual actions will be taken")

    results = get_hit_results(CONFIG[args.name]["hit_id"])
    # Call a method to filter the results based on arbitrary logic
    # Pass the method name in the config file and define it here (hack)
    # Default to method filter "get_worker_installs"
    results = locals()[CONFIG[args.name].get("filter", "get_worker_installs")](results)

    add_workers_to_qualification(
        results, CONFIG[args.name]["qualification_id"], args.no_dry
    )
    if CONFIG[args.name]["bonus"]:
        grant_bonus(results, args.no_dry)
    notify_workers_postsurvey(results, get_message_text("na"), args.no_dry)
