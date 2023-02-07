default:
	analyze 

sync:
	aws s3 sync s3://extension-survey-study data_pilot_v2
	python3 data2csv.py

sync-legacy:
	aws s3 sync s3://twitter-feed-test data 
	python3 data2csv.py

analyze: sync
	Rscript -e 'library(rmarkdown); rmarkdown::render("../analysis/pilot-copy.Rmd", "html_document")'
	open ../analysis/pilot-copy.html
