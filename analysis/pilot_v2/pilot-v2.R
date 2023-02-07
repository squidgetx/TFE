prepare_data <- function(tweet_df) {
    presurvey_df <- bind_rows(
        read_csv(here("analysis/pilot_v2/data/presurvey_vanilla_numeric.csv")) %>%
            mutate(`uninstall-confirm` = NA) %>%
            select(!Employment) %>%
            rename(`therm-dem_1` = thermometer_2, `therm-rep_2` = thermometer_4),
        read_csv(here("analysis/pilot_v2/data/presurvey_bonus_numeric.csv"))
    )
    demo_df <- rbind(
        read_csv(here("analysis/pilot_v2/data/prolific_demo_vanilla-09-14.csv")),
        read_csv(here("analysis/pilot_v2/data/prolific_demo_bonus_09-14.csv"))
    ) %>%
        rename(
            gender = Gender,
            age = Age,
            state = `Current u.s state of residence`,
            employment = `Employment status`,
            PROLIFIC_PID = `Participant id`
        ) %>%
        mutate(
            gender = factor(
                gender,
                levels = c(
                    "Man (including Trans Male/Trans Man)",
                    "Woman (including Trans Female/Trans Woman)",
                    "Non-binary (would like to give more detail)"
                )
            )
        )
    levels(demo_df$gender) <- c("Male", "Female", "Non-binary")

    id_cols <- c("PROLIFIC_PID")
    demo_cols <- c(
        "pid3",
        "ideo",
        "age",
        "gender",
        "educ",
        "media_tv",
        "media_newspaper",
        "media_radio",
        "media_internet",
        "media_discussion",
        "uninstall"
    )
    outcome_cols <- c(
        "thermo_dems",
        "thermo_reps",
        "dist_trump",
        "dist_biden",
        "perceived_1",
        "perceived_2",
        "perceived_3",
        "media_bias",
        "media_trust",
        "issue_openborder",
        "issue_climate",
        "issue_woke",
        "issue_freetrade",
        "importance_inflation",
        "importance_climate",
        "importance_china",
        "importance_freespeech",
        "importance_healthcare",
        "importance_crime",
        "importance_trump",
        "importance_bordersecurity",
        "importance_opioid",
        "importance_guncontrol"
    )

    pre_df <- rename(presurvey_df,
        attention_check = Q27,
        pid3 = Q2,
        ideo = Q3,
        educ = Q6,
        media_tv = Q7_1,
        media_newspaper = Q7_2,
        media_radio = Q7_3,
        media_internet = Q7_4,
        media_discussion = Q7_5,
        dist_trump = distance_1,
        `dist_biden` = Q28_1,
        thermo_dems = `therm-dem_1`,
        thermo_reps = `therm-rep_2`,
        media_bias = `trust-1`,
        media_trust = `trust-2`,
        issue_openborder = `issue-positions_1`,
        issue_climate = "issue-positions_2",
        issue_woke = "issue-positions_3",
        issue_freetrade = "issue-positions_4",
        importance_inflation = "issue-importance_1",
        importance_climate = "issue-importance_2",
        importance_china = "issue-importance_3",
        importance_freespeech = "issue-importance_4",
        importance_healthcare = "issue-importance_5",
        importance_crime = "issue-importance_6",
        importance_trump = "issue-importance_7",
        importance_bordersecurity = "issue-importance_8",
        importance_opioid = "issue-importance_9",
        importance_guncontrol = "issue-importance_10",
        uninstall = "uninstall-confirm"
    ) %>%
        left_join(demo_df, by = "PROLIFIC_PID") %>%
        filter(!is.na(PROLIFIC_PID)) %>%
        # transform categorical variables correctly
        mutate(
            pid3 = recode(pid3, `1` = "Democrat", `2` = "Republican", `3` = "Independent"),
            # Number of years of education
            educ = recode(educ, `1` = 10, `2` = 12, `3` = 14, `4` = 16, `5` = 18),
            ideo = 5 - ideo,
            # 0.5 = part time, 1 = full time
            employment = recode(employment, `Full-Time` = 1, `Part-Time` = 0.5, `Unemployed (and job seeking)` = 0, `Not in paid work (e.g. homemaker', 'retired or disabled)` = 0),
            # Number of times per week
            media_tv = recode(media_tv, `1` = 4 * 7, `2` = 7, `3` = 4, `4` = 1, `5` = 0),
            media_internet = recode(media_internet, `1` = 4 * 7, `2` = 7, `3` = 4, `4` = 1, `5` = 0),
            media_newspaper = recode(media_newspaper, `1` = 4 * 7, `2` = 7, `3` = 4, `4` = 1, `5` = 0),
            media_radio = recode(media_radio, `1` = 4 * 7, `2` = 7, `3` = 4, `4` = 1, `5` = 0),
            media_discussion = recode(media_discussion, `1` = 4 * 7, `2` = 7, `3` = 4, `4` = 1, `5` = 0),
            uninstall = recode(uninstall, `1` = TRUE, `2` = TRUE, `4` = FALSE)
        ) %>%
        mutate_at(c("age", outcome_cols), as.numeric)

    usage_df <- tweet_df %>%
        mutate(
            PROLIFIC_PID = workerID
        ) %>%
        group_by(PROLIFIC_PID) %>%
        summarize(
            installed = sum(event == "install"),
            total_tweets = sum(event == "show", na.rm = TRUE),
            total_fox_tweets = sum(is_fox, na.rm = TRUE),
            fox_tweets_accounts = sum(blacklist_author, na.rm = TRUE),
            fox_tweets_links = sum(blacklist_text, na.rm = TRUE),
            total_hidden = sum(is_fox & treatment_group != 0, na.rm = TRUE),
            total_link_hidden = sum(is_fox & treatment_group == 1, na.rm = TRUE),
            total_account_hidden = sum(is_fox & treatment_group == 2, na.rm = TRUE),
            total_political = sum(political | is_fox | liberal, na.rm = TRUE),
            total_liberal = sum(liberal, na.rm = TRUE),
            proportion_political = total_political / total_tweets,
            proportion_liberal = total_liberal / total_political,
            treatment_group = first(treatment_group)
        )

    pre_df_usage <- left_join(
        pre_df,
        usage_df,
        by = "PROLIFIC_PID"
    )

    setup_outcomes <- function(df) {
        # Set up the main outcome variables
        # so that they are linearly scaled and ready to be
        # z-scored and combined into indexes later

        df %>% mutate(
            # How do we measure affective polarization?
            # measure Repub's distaste for Dems and vice versa.
            # For missing party ID, look at the lowest between the two thermometer ratings
            thermo = case_when(
                pid3 == "Democrat" ~ thermo_reps,
                pid3 == "Republican" ~ thermo_dems,
                TRUE ~ pmin(thermo_reps, thermo_dems, na.rm = TRUE)
            ),
            distance = case_when(
                pid3 == "Democrat" ~ dist_trump,
                pid3 == "Republican" ~ dist_biden,
                TRUE ~ pmin(dist_trump, dist_biden, na.rm = TRUE)
            ),
            # Media trust: normalize so bias is nonpartisan
            media_bias = abs(media_bias - 3),
            # Issues: larger score = more democratic
            issue_woke = 5 - issue_woke
            # Issue priorities:
            # not sure how to go about this
            # Could code certain issues as "conservative" issues
            # And then have a "conserative priorit" index
            # And/Or just show results separately for every single issue lol
        )
    }
    pre_df <- setup_outcomes(pre_df_usage)
    outcomes <- c(
        "thermo",
        "distance",
        "media_bias",
        "media_trust",
        "issue_openborder",
        "issue_climate",
        "issue_woke",
        "issue_freetrade",
        "importance_inflation",
        "importance_climate",
        "importance_china",
        "importance_freespeech",
        "importance_healthcare",
        "importance_crime",
        "importance_trump",
        "importance_bordersecurity",
        "importance_opioid",
        "importance_guncontrol"
    )
    # Calculate indexes of main dependent variables:
    zscore <- function(a) {
        (a - mean(a, na.rm = TRUE)) / sd(a, na.rm = TRUE)
    }
    pre_df <- mutate_at(pre_df, outcomes, c(z = zscore))

    # Import post-survey data
    post_df <- read_csv(here("analysis/pilot_v2/data/postsurvey-09-18.csv")) %>%
        rename(
            "thermo_dems" = "Q8_1",
            "thermo_reps" = "Q8_2",
            "dist_trump" = "Q10_1",
            "dist_biden" = "Q10_2",
            "perceived_1" = "Q12_1",
            "perceived_2" = "Q12_2",
            "perceived_3" = "Q12_3",
            "media_bias" = "Q14",
            "media_trust" = "Q15",
            "twitter_changes_openended" = "Q19",
            "feedback_openended" = "Q20",
            issue_openborder = `issue-positions_1`,
            issue_climate = "issue-positions_2",
            issue_woke = "issue-positions_3",
            issue_freetrade = "issue-positions_4",
            importance_inflation = "issue-importance_1",
            importance_climate = "issue-importance_2",
            importance_china = "issue-importance_3",
            importance_freespeech = "issue-importance_4",
            importance_healthcare = "issue-importance_5",
            importance_crime = "issue-importance_6",
            importance_trump = "issue-importance_7",
            importance_bordersecurity = "issue-importance_8",
            importance_opioid = "issue-importance_9",
            importance_guncontrol = "issue-importance_10",
        ) %>%
        mutate_at(outcome_cols, as.numeric) %>%
        left_join(pre_df %>% select("PROLIFIC_PID", pid3), by = "PROLIFIC_PID") %>%
        setup_outcomes()

    # take postsurvey outcomes and calculate zscores using the presurvey
    # distributions
    for (col in outcomes) {
        post_df[[paste0(col, "_z.post")]] <- (post_df[[col]] - mean(pre_df[[col]], na.rm = TRUE)) / sd(pre_df[[col]], na.rm = TRUE)
    }

    post_df <- post_df %>% select(c(
        "PROLIFIC_PID",
        paste0(outcomes, "_z.post"),
        "twitter_changes_openended",
        "feedback_openended",
    ))


    library(mice)
    # impute all pre-survey demographic variables and outcome measures
    # don't impute response to uninstallation question lol
    impute_vars <- c(demo_cols[demo_cols != "uninstall"], outcomes)
    imputed_data <- mice(
        pre_df %>% select(impute_vars),
        m = 5,
        seed = 352
    )
    imputed_pre_df <- complete(imputed_data)
    # reassemble dataaset with additional variables we need for subsequent analysis
    pre_df <- cbind(pre_df %>% select(!impute_vars), imputed_pre_df) %>% mutate(
        affective_index = rowMeans(select(., thermo_z, distance_z), na.rm = TRUE),
        trust_index = rowMeans(select(., media_bias_z, media_trust_z), na.rm = TRUE),
        ideological_index = -rowMeans(select(., issue_openborder_z, issue_climate_z, issue_woke_z, issue_freetrade_z), na.rm = TRUE),
        conservative_priorities_index = -rowMeans(select(., importance_inflation_z, importance_china_z, importance_freespeech_z, importance_crime_z, importance_bordersecurity_z, importance_opioid_z), na.rm = TRUE),
        twitter_proportion = media_internet / (media_internet + media_discussion + media_tv + media_radio + media_newspaper),
        treated = treatment_group %in% c(1, 2),
        social = treatment_group %in% c(2),
    )

    survey_df <- pre_df %>%
        left_join(post_df, by = "PROLIFIC_PID") %>%
        mutate(
            affective_index.post = rowMeans(select(., thermo_z.post, distance_z.post), na.rm = TRUE),
            trust_index.post = rowMeans(select(., media_bias_z.post, media_trust_z.post), na.rm = TRUE),
            ideological_index.post = -rowMeans(select(., issue_openborder_z.post, issue_climate_z.post, issue_woke_z.post, issue_freetrade_z), na.rm = TRUE),
            conservative_priorities_index.post = -rowMeans(select(., importance_inflation_z.post, importance_china_z.post, importance_freespeech_z.post, importance_crime_z, importance_bordersecurity_z, importance_opioid_z), na.rm = TRUE),
            postsurvey = PROLIFIC_PID %in% post_df$PROLIFIC_PID
        )
}

analyze_tweets <- function() {
    df <- read_tsv(here("analysis/pilot_v2/data/formatted_data.tsv"),
        col_types = (list(
            install_code = col_character()
        ))
    ) %>%
        mutate(
            is_fox = blacklist_text | blacklist_author,
            event = ifelse(str_detect(event, "hide"), "show", event),
            date = as.POSIXct(time / 1000, origin = "1970-01-01") %>% as.Date()
        ) %>%
        filter(!is.na(treatment_group)) %>%
        filter(!str_detect(workerID, "test"))

    # Extremely rudimentary keyword style political content
    keywords <- c(
        " democrat",
        " republican",
        " liberal",
        " conservative",
        " white house",
        " trump",
        " biden",
        " president",
        " congress",
        " law",
        " policy",
        " election",
        " voter",
        " politician",
        " politics",
        " CNN",
        " Fox News",
        " GOP",
        " news",
        " union",
        " climate change"
    )
    liberal_sources <- c(
        "nytimes",
        "NewYorker",
        "Slate",
        "TheDailyShow",
        "guardian", "AlJazAmerica",
        "NPR", "maddow",
        "MSNBCDaily",
        "CNN",
        "NBCNews",
        "BuzzFeed",
        "PBS",
        "frontlinepbs",
        "BBCAmerica",
        "HuffPost",
        "washingtonpost",
        "TheEconomist",
        "EconUS",
        "politico"
    )

    df <- df %>% mutate(
        political = str_detect(text, paste0("(?i)", paste(keywords, collapse = "|"))),
        liberal = str_detect(author, paste0("(?i)", paste(liberal_sources, collapse = "|")))
    )

    fox_users <- df %>%
        group_by(workerID, is_fox) %>%
        summarize(n()) %>%
        filter(is_fox) %>%
        .$workerID
    df <- df %>% mutate(
        fox_user = workerID %in% fox_users
    )
    df
}

save_data <- function() {
    df <- analyze_tweets()
    survey_df <- prepare_data(df)
    save(survey_df, file = "survey_data.Rda")
    save(df, file = "tweet_data.Rda")
}
save_data()
