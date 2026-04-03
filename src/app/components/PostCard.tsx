import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Users, Tag, Edit } from 'lucide-react';
import { WorkPost } from '../types';
import { useAuth } from '../context/AuthContext';

interface PostCardProps {
  post: WorkPost;
}

const categoryColors: Record<string, string> = {
  Mason: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Electrician: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Plumber: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Interior Designer': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Architect: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Carpenter: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Painter: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
};

function formatCurrency(amount: number) {
  if (amount >= 1000000) return `Rs. ${(amount / 1000000).toFixed(1)} Mn`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(0)}K`;
  return `Rs. ${amount}`;
}

export function PostCard({ post }: PostCardProps) {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.uid === post.userId;

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {post.images && post.images[0] && (
        <div className="h-40 overflow-hidden relative">
          <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
          {isOwner && (
            <Link
              to={`/posts/${post.id}/edit`}
              onClick={e => e.stopPropagation()}
              className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 hover:bg-maroon text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Edit className="w-3 h-3" /> Edit Post
            </Link>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[post.category] || 'bg-muted text-muted-foreground'}`} style={{ fontWeight: 500 }}>
              <Tag className="w-3 h-3 inline mr-1" />
              {post.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[post.status]}`} style={{ fontWeight: 500 }}>
              {post.status}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">{timeAgo(post.postedAt)}</span>
            {/* Edit button for posts without images */}
            {isOwner && !post.images?.[0] && (
              <Link
                to={`/posts/${post.id}/edit`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 bg-muted hover:bg-maroon-light border border-border hover:border-maroon/30 text-foreground hover:text-maroon text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Edit className="w-3 h-3" /> Edit
              </Link>
            )}
          </div>
        </div>

        <h3 className="text-card-foreground mb-2 line-clamp-2" style={{ fontWeight: 600 }}>{post.title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5 text-gold flex-shrink-0" />
            <span>{formatCurrency(post.budgetMin)} – {formatCurrency(post.budgetMax)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-maroon flex-shrink-0" />
            <span>{post.timeline}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground col-span-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{post.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={post.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=8B1A2F&color=fff`}
              alt={post.userName}
              className="w-7 h-7 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userName)}&background=8B1A2F&color=fff`;
              }}
            />
            <span className="text-sm text-muted-foreground">{post.userName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{post.bids.length} {post.bids.length === 1 ? 'bid' : 'bids'}</span>
            </div>
            <Link
              to={`/posts/${post.id}`}
              className="bg-maroon text-white px-3 py-1.5 rounded-lg text-sm hover:bg-maroon-dark transition-colors"
              style={{ fontWeight: 500 }}
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}