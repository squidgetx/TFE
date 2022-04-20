"""
processes round 2 workers
"""
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
                    WorkerId=worker["WorkerId"],
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
    installs = get_worker_installs(results)

    add_workers_to_qualification(
        installs, CONFIG[args.name]["qualification_id"], args.no_dry
    )
    if CONFIG[args.name]["bonus"]:
        grant_bonus(installs, args.no_dry)
    notify_workers_postsurvey(installs, get_message_text("na"), args.no_dry)
