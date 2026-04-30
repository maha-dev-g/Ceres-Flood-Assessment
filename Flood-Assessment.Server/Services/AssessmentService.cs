using Flood_Assessment.Server.DTOs;
using Flood_Assessment.Server.Model;
using Flood_Assessment.Server.Repositories;

namespace Flood_Assessment.Server.Services
{
    // Services/AssessmentService.cs
    // Services/AssessmentService.cs
    public class AssessmentService
    {
        private readonly IAssessmentRepository _repo;

        public AssessmentService(IAssessmentRepository repo)
        {
            _repo = repo;
        }

        public void Create(AssessmentDto dto)
        {
            var model = new Assessment
            {
                Id = dto.Id,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Address = dto.Address,
                Condition = dto.Condition,
                ChickenCount = dto.ChickenCount,
                PhotoUrls = dto.PhotosBase64 // temp (simulate)
            };

            _repo.Add(model);
        }

        public List<Assessment> GetAll() => _repo.GetAll();
    }
}
