default:
	sync

sync:
	aws s3 sync s3://twitter-feed-test data 
	python3 data2csv.py
