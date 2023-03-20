import { CONFIG } from "./config"
import { intervalToDuration } from "date-fns"

export const GROUPS = {
    CONTROL: 0,
    ADD: 1,
    REMOVE: 2,
    ADD_AND_REMOVE: 3,
}

export const STAGE = {
    UNINSTALLED: 'uninstalled',
    WARMUP: 'warmup',
    TREATMENT: 'treatment',
    ENDLINE: 'endline',
    BEHAVIOR: 'behavior',
    FINISHED: 'finished',
}

export const getDaysSinceInstall = (exp_config) => {
    if (exp_config.install_time == null) {
        return null
    }
    if (exp_config.mock_days) {
        return exp_config.mock_days
    }
    return intervalToDuration({
        start: exp_config.install_time,
        end: Date.now(),
    }).days;
}

/* return the current experiment stage */
export const getStage = (exp_config) => {
    if (exp_config.install_time == null) {
        return STAGE.UNINSTALLED
    }
    const daysSinceInstall = getDaysSinceInstall(exp_config)

    const warmup = CONFIG.warmupDays;
    const treatment = CONFIG.warmupDays + CONFIG.treatmentDays;
    const endline = CONFIG.warmupDays + CONFIG.treatmentDays + CONFIG.endlineDays;
    const behavior = CONFIG.warmupDays + CONFIG.treatmentDays + CONFIG.endlineDays + CONFIG.behaviorTestDays;

    if (daysSinceInstall > behavior) {
        return STAGE.FINISHED
    }
    if (daysSinceInstall > endline) {
        return STAGE.BEHAVIOR
    }
    if (daysSinceInstall > treatment) {
        return STAGE.ENDLINE
    }
    if (daysSinceInstall > warmup) {
        return STAGE.TREATMENT
    }
    return STAGE.WARMUP
}
