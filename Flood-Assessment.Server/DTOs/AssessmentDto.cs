namespace Flood_Assessment.Server.DTOs
{
    // DTOs/AssessmentDto.cs
    public class AssessmentDto
    {
        public string Id { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public int ChickenCount { get; set; }
        public List<string> PhotosBase64 { get; set; } = new();
    }
}
