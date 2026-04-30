using Flood_Assessment.Server.Model;

namespace Flood_Assessment.Server.Repositories
{
    public interface IAssessmentRepository
    {
        void Add(Assessment assessment);
        List<Assessment> GetAll();
    }

    public class AssessmentRepository : IAssessmentRepository
    {
        private static List<Assessment> _db = new();

        public void Add(Assessment assessment) => _db.Add(assessment);

        public List<Assessment> GetAll() => _db;
    }
}
