using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace BuildingMaterialAPI.Hubs
{
    public class LocationHub : Hub
    {
        public async Task JoinTrackingGroup(string maGH)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Tracking_{maGH}");
        }

        public async Task LeaveTrackingGroup(string maGH)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Tracking_{maGH}");
        }

        public async Task SendLocationUpdate(string maGH, double lat, double lng, string currentLocation)
        {
            // Broadcast location to all clients listening to this order's tracking group
            await Clients.Group($"Tracking_{maGH}").SendAsync("ReceiveLocationUpdate", new { maGH, lat, lng, currentLocation, timestamp = System.DateTime.UtcNow });
        }
    }
}
