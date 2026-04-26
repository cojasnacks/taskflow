import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function NotificationsPanel({ onClose }) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute left-52 bottom-16 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-accent hover:underline">
              Tout lire
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Aucune notification</p>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-accent-light/30' : ''}`}>
              <p className="text-xs text-gray-800 leading-relaxed">{n.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
