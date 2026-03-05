import { useState } from 'react';
import Icon from '../../../components/AppIcon';

const CampaignLeaderboard = ({ campaigns, allCampaigns = [] }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">Top Campaigns</h2>
            <p className="caption text-muted-foreground text-sm">Best performing sequences</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-lg">
            <Icon name="Trophy" size={20} color="var(--color-success)" />
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {campaigns?.map((campaign, index) => (
            <div
              key={campaign?.id}
              className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-250 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-warning text-warning-foreground' :
                    index === 1 ? 'bg-muted-foreground/20 text-foreground' :
                    index === 2 ? 'bg-accent/20 text-accent': 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{campaign?.name}</h3>
                    <p className="caption text-muted-foreground text-xs mt-0.5">{campaign?.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">{campaign?.convertedRate}%</p>
                  <p className="caption text-muted-foreground text-xs whitespace-nowrap">{campaign?.emailsSent} sent</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="caption text-muted-foreground">Converted Rate</span>
                  <span className="font-medium text-foreground">{campaign?.convertedRate}%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all duration-500"
                    style={{ width: `${campaign?.convertedRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="caption text-muted-foreground text-xs mb-1">Opens</p>
                  <p className="text-sm font-semibold text-foreground">{campaign?.openRate}%</p>
                </div>
                <div className="text-center">
                  <p className="caption text-muted-foreground text-xs mb-1">Clicks</p>
                  <p className="text-sm font-semibold text-foreground">{campaign?.clickRate}%</p>
                </div>
                <div className="text-center">
                  <p className="caption text-muted-foreground text-xs mb-1">Converted</p>
                  <p className="text-sm font-semibold text-foreground">{campaign?.converted}</p>
                </div>
              </div>
            </div>
          ))}

          {campaigns?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon name="Trophy" size={32} color="var(--color-muted-foreground)" />
              <p className="text-sm text-muted-foreground mt-3">No campaigns yet</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-4 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-all duration-250 touch-target flex items-center justify-center gap-2 shrink-0"
        >
          <span>View All Campaigns</span>
          <Icon name="ArrowRight" size={16} />
        </button>
      </div>

      {/* All Campaigns Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-lg">
                  <Icon name="Trophy" size={20} color="var(--color-success)" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">All Campaigns</h3>
                  <p className="text-xs text-muted-foreground">{allCampaigns.length} campaigns ranked by performance</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon name="X" size={18} color="var(--color-muted-foreground)" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {allCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon name="Trophy" size={40} color="var(--color-muted-foreground)" />
                  <p className="text-sm text-muted-foreground mt-4">No campaigns to display</p>
                </div>
              ) : (
                allCampaigns.map((campaign, index) => (
                  <div
                    key={campaign?.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    {/* Rank badge */}
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm shrink-0 ${
                      index === 0 ? 'bg-warning text-warning-foreground' :
                      index === 1 ? 'bg-muted-foreground/20 text-foreground' :
                      index === 2 ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Name + type */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{campaign?.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign?.type}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-muted-foreground mb-0.5">Opens</p>
                        <p className="text-sm font-semibold text-foreground">{campaign?.openRate}%</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-muted-foreground mb-0.5">Clicks</p>
                        <p className="text-sm font-semibold text-foreground">{campaign?.clickRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Sent</p>
                        <p className="text-sm font-semibold text-foreground">{campaign?.emailsSent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Converted</p>
                        <p className="text-sm font-bold text-success">{campaign?.convertedRate}%</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 text-sm font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignLeaderboard;
