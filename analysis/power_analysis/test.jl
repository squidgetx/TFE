using Random, Distributions, GLM, Plots, DataFrames

alpha = 0.05
sims = 500

# treatment potential outcome
tau = 0.1
normal = Normal()
Ns = range(100, 3000, step=20)
powers = map(function (N)
        Y0 = rand(normal, N)
        Y1 = Y0 .+ tau
        intercept = ones(N)
        map(function (iter)
                Z = rand((0, 1), N)
                Y = Y1 .* Z .+ Y0 .* (1 .- Z)
                model = lm([intercept Z], Y)
                coeftable(model).cols[4][2] <= alpha
            end, 1:sims) |> mean
    end, Ns)

plot(Ns, powers, seriestype=:scatter)