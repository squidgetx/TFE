import boto3

questions = open("qualification_test.xml", "rt").read()
answers = open("answerkey.xml", "rt").read()

mturk = boto3.client(
    "mturk",
    region_name="us-east-1",
    # endpoint_url="https://mturk-requester-sandbox.us-east-1.amazonaws.com",
)

qual_response = mturk.create_qualification_type(
    Name="Twitter usage qualification",
    Keywords="test, qualification, sample, twitter, boto",
    Description="This is a brief survey on twitter usage ",
    QualificationTypeStatus="Active",
    Test=questions,
    AnswerKey=answers,
    TestDurationInSeconds=300,
)

print(qual_response["QualificationType"]["QualificationTypeId"])
