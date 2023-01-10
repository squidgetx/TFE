start:
	pg_ctl -D pgdata/ -l logfile start

init:
	mkdir pgdata
	initdb pgdata
	createdb server-dev
	psql server-dev -c "CREATE USER testuser PASSWORD 'password'"
	psql server-dev -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO testuser;"

scrape: 
	npm scrape

copyelites:
	psql server-dev -c "\copy elites(username, ideo, id, followers_count, rank) FROM 'elites.tsv' WITH (format csv, delimiter E'\t', header);"
