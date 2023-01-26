Process for picking accounts

1. Start with csmap list of media elites. (1-csmap-media.tsv, by filtering only media organizations from 0-csmap-elites.tsv)
2. Filter to Top 150 by follower count and calculate ideology scores using `get_twitter_user.py`, `estimate_ideology.py` and `estimateIdeology.R`. Results in `3-csmap-media.hydrated.ideology.tsv`
3. Take accounts in the 0.4-0.9 magnitude ideology score and then remove affiliate accounts, inactive accounts, and accounts that do not share much domestic politics news (exclude focus on foreign news or business or too many local/city-specific stories) (This step is manual, results in 4-chosen_media_accounts.tsv)
4. Download all accounts that each final media account follows that each have over 1M followers or over 250K followers that mention the media account in its description (code: find_followers.py)
5. Manually inspect these accounts using same criteria (active, domestic politics, english)
6. Results stored in `7-media-elites.combined.tsv`
