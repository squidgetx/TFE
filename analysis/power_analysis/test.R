possible.ns <- seq(from = 100, to = 3000, by = 20)
powers <- rep(NA, length(possible.ns))
alpha <- 0.05
sims <- 500
tau <- 0.1
for (j in 1:length(possible.ns)) {
    N <- possible.ns[j]
    significant.experiments <- rep(NA, sims)

    Y0 <- rnorm(n = N, mean = 0, sd = 1)
    Y1 <- Y0 + tau
    for (i in 1:sims) {
        Z.sim <- sample(rep(c(0, 1), N / 2))
        Y.sim <- Y1 * Z.sim + Y0 * (1 - Z.sim)
        fit.sim <- lm(Y.sim ~ Z.sim)
        p.value <- summary(fit.sim)$coefficients[2, 4]
        significant.experiments[i] <- (p.value <= alpha)
    }
    powers[j] <- mean(significant.experiments)
}