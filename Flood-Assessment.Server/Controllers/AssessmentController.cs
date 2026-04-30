using Flood_Assessment.Server.DTOs;
using Flood_Assessment.Server.Model;
using Flood_Assessment.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flood_Assessment.Server.Controllers
{
    [ApiController]
    [Route("api/assessment")]
    public class AssessmentController : ControllerBase
    {
        private readonly AssessmentService _service;

        public AssessmentController(AssessmentService service)
        {
            _service = service;
        }

        [HttpPost]
        public IActionResult Create([FromBody] AssessmentDto dto)
        {
            _service.Create(dto);
            return Ok(new { message = "Synced successfully" });
        }

        [HttpGet]
        public IActionResult Get()
        {
            return Ok(_service.GetAll());
        }
    }
}
