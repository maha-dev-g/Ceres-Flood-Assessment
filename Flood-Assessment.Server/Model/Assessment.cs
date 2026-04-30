namespace Flood_Assessment.Server.Model
{
    // Models/Assessment.cs
    public class Assessment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public int ChickenCount { get; set; }
        public List<string> PhotoUrls { get; set; } = new();
    }
}
