using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace HiIntelligence.Api.Hubs
{
    public class AnalyticsHub : Hub
    {
        public async Task JoinRegion(string regionName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Region_{regionName}");
        }

        public async Task LeaveRegion(string regionName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Region_{regionName}");
        }

        public async Task JoinStore(int storeId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Store_{storeId}");
        }

        public async Task LeaveStore(int storeId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Store_{storeId}");
        }
    }
}
