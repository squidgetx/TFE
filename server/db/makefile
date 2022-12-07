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