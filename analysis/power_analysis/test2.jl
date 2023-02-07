using Random, Distributions, GLM, DataFrames, DataFramesMeta, Gadfly, Pipe

const alpha = 0.05
const sims = 500

const Ns = range(100, 5000, step=50)

function simple_assignment(N)
        rand((0, 1), N)
end

function block_assignment(N)
        assignment = vcat(zeros(Int16(N / 2)), ones(Int16(N / 2))) |> shuffle
        if N % 2 == 1
                assignment = vcat(assignment, rand((0, 1)))
        end
        assignment
end

function stratified_assignment(df)
        # use df.bucket to perform block stratified randomization
        @chain begin
                groupby(df, :bucket)
                @transform :Z = block_assignment(length(:bucket))
        end
end

function run_experiment(df, N, assignment)
        if (assignment == stratified_assignment)
                df = stratified_assignment(df)
        else
                df.Z = assignment(N)
        end
        df.Y = df.Y1 .* df.Z .+ df.Y0 .* (1 .- df.Z)
        model = lm(@formula(Y ~ Z + X), df)
        coeftable(model).cols[4][2] <= alpha
end


function get_power(N, sims, tau, assignment, covariance)
        # Run sims experiments with sample size N using 
        # the given assignment function and covariance/correlation for 
        # a single covariate with the potential outcome
        # (outcome and covariance are generated with sd=1 so cov==cor)
        means = [0, 0]
        cov = [1 covariance; covariance 1]
        mvr = MvNormal(means, cov)
        X = rand(mvr, N) |> transpose
        Y0 = @view X[:, 2]
        Y1 = Y0 .+ tau
        df = DataFrame(Y0=Y0, Y1=Y1, X=X[:, 1])
        (run_experiment(df, N, assignment) for iter in 1:sims) |> mean
end

function power_analysis(Ns, sims, tau, assignment, covariance)
        powers = [get_power(N, sims, tau, assignment, covariance) for N in Ns]
        df = DataFrame(N=Ns, power=powers)
        df.d .= tau
        df.cov .= covariance
        df
end

df = @pipe [
        power_analysis(Ns, sims, t, simple_assignment, 0.9) for t in range(0.03, 0.12, step=0.01)
] |> reduce(vcat, _)

plot(
        df,
        x=:N,
        y=:power,
        color=:d,
        yintercept=[0.8],
        Geom.smooth,
        Scale.color_discrete(),
        Geom.hline(style=:dot),
        Guide.xticks(ticks=100:300:5000),
        Guide.yticks(ticks=[0, 0.5, 0.8, 1])
)
