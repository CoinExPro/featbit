using Application.Bases.Models;
using Application.ExperimentMetrics;
using Application.Experiments;
using Domain.Experiments;

namespace Api.Controllers;

[Route("api/v{version:apiVersion}/envs/{envId:guid}/experiments")]
public class ExperimentController : ApiControllerBase
{
    [HttpGet]
    public async Task<ApiResponse<PagedResult<ExperimentVm>>> GetListAsync(
        Guid envId,
        [FromQuery] ExperimentFilter filter)
    {
        var request = new GetExperimentList
        {
            EnvId = envId,
            Filter = filter
        };

        var expts = await Mediator.Send(request);
        return Ok(expts);
    }
    
    [HttpPost]
    public async Task<ApiResponse<Experiment>> CreateAsync(Guid envId, CreateExperiment request)
    {
        request.EnvId = envId;

        var experiment = await Mediator.Send(request);
        return Ok(experiment);
    }
    
    [HttpGet("status-count")]
    public async Task<ApiResponse<IEnumerable<ExperimentStatusCountVm>>> GetExperimentStatusCounterAsync(Guid envId)
    {
        var request = new GetExperimentStatusCount
        {
            EnvId = envId
        };

        var status = await Mediator.Send(request);
        return Ok(status);
    }
    
    [HttpPut("iteration-results")]
    public async Task<ApiResponse<IEnumerable<ExperimentIterationResultsVm>>> GetExperimentIterationResultsAsync(Guid envId, IEnumerable<ExperimentIterationParam> experimentIterationParam)
    {
        var request = new GetExperimentIterationResults
        {
            EnvId = envId,
            ExperimentIterationParam = experimentIterationParam
        };

        var results = await Mediator.Send(request);
        return Ok(results);
    }
    
    [HttpPost("{experimentId}/iterations")]
    public async Task<ApiResponse<ExperimentIteration>> StartIterationAsync(Guid envId, Guid experimentId)
    {
        var request = new StartIteration
        {
            EnvId = envId,
            ExperimentId = experimentId
        };

        var iteration = await Mediator.Send(request);
        return Ok(iteration);
    }
    
    [HttpDelete("{experimentId}/iterations")]
    public async Task<ApiResponse<bool>> ArchiveExperimentIterations(Guid envId, Guid experimentId)
    {
        var request = new ArchiveExperimentIterations
        {
            EnvId = envId,
            ExperimentId = experimentId
        };

        var success = await Mediator.Send(request);
        return Ok(success);
    }
    
    [HttpPut("{experimentId}/iterations/{iterationId}")]
    public async Task<ApiResponse<ExperimentIteration>> StopIterationAsync(Guid envId, Guid experimentId, string iterationId)
    {
        var request = new StopIteration
        {
            EnvId = envId,
            ExperimentId = experimentId,
            IterationId = iterationId
        };

        var iteration = await Mediator.Send(request);
        return Ok(iteration);
    }
    
    [HttpDelete("{experimentId}")]
    public async Task<ApiResponse<bool>> ArchiveExperimentAsync(Guid envId, Guid experimentId)
    {
        var request = new ArchiveExperiment
        {
            EnvId = envId,
            ExperimentId = experimentId
        };

        var success = await Mediator.Send(request);
        return Ok(success);
    }
}