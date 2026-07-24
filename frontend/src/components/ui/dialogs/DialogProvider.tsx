import { createContext, useContext, useState, useCallback } from 'react'
import { AlertTriangle, Info, Trash2, CheckCircle, HelpCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type DialogVariant = 'info' | 'warning' | 'danger' | 'success'

interface DialogOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  placeholder?: string
  defaultValue?: string
}

interface DialogState extends DialogOptions {
  type: 'alert' | 'confirm' | 'prompt'
  message: string
  resolve: (value: any) => void
}

interface DialogContextValue {
  alert: (message: string, options?: DialogOptions) => Promise<void>
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>
  prompt: (message: string, options?: DialogOptions) => Promise<string | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

const VARIANT_CONFIG = {
  info:    { Icon: Info,          ring: 'text-cyan-400',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20',   btn: 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/30' },
  warning: { Icon: AlertTriangle, ring: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  btn: 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30' },
  danger:  { Icon: Trash2,        ring: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',    btn: 'bg-red-500 hover:bg-red-400 shadow-red-500/30' },
  success: { Icon: CheckCircle,   ring: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20',btn: 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30' },
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [promptValue, setPromptValue] = useState('')

  const alert = useCallback((message: string, options?: DialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({ type: 'alert', message, variant: 'info', ...options, resolve })
    })
  }, [])

  const confirm = useCallback((message: string, options?: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ type: 'confirm', message, variant: 'warning', ...options, resolve })
    })
  }, [])

  const prompt = useCallback((message: string, options?: DialogOptions): Promise<string | null> => {
    setPromptValue(options?.defaultValue || '')
    return new Promise((resolve) => {
      setDialog({ type: 'prompt', message, variant: 'info', ...options, resolve })
    })
  }, [])

  const handleConfirm = () => {
    if (!dialog) return
    if (dialog.type === 'prompt') dialog.resolve(promptValue)
    else if (dialog.type === 'confirm') dialog.resolve(true)
    else dialog.resolve(undefined)
    setDialog(null)
  }

  const handleCancel = () => {
    if (!dialog) return
    if (dialog.type === 'confirm') dialog.resolve(false)
    else dialog.resolve(null)
    setDialog(null)
  }

  const variant = dialog?.variant || 'info'
  const cfg = VARIANT_CONFIG[variant]
  const { Icon } = cfg

  const defaultTitle = !dialog ? '' : dialog.type === 'alert' ? 'Notice' : dialog.type === 'confirm' ? 'Confirm action' : 'Enter value'

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}

      {dialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* scrim */}
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
            onClick={dialog.type !== 'alert' ? handleCancel : undefined}
          />

          {/* card */}
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200 rounded-[2rem] bg-[#0d1b2e] border border-slate-700/40 shadow-2xl overflow-hidden">
            {/* top gradient bar */}
            <div className={cn('h-[3px]', cfg.bg)} style={{
              background: `linear-gradient(90deg, transparent 0%, currentColor 50%, transparent 100%)`,
            }} />

            <div className="p-8">
              {/* close (alert only) */}
              {dialog.type === 'alert' && (
                <button
                  onClick={handleConfirm}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* icon + text */}
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border',
                  cfg.bg, cfg.border
                )}>
                  <Icon className={cn('w-5 h-5', cfg.ring)} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-[15px] font-black text-slate-100 tracking-tight">
                    {dialog.title || defaultTitle}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-400 font-medium leading-relaxed">
                    {dialog.message}
                  </p>
                </div>
              </div>

              {/* prompt input */}
              {dialog.type === 'prompt' && (
                <input
                  autoFocus
                  value={promptValue}
                  onChange={e => setPromptValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirm()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  placeholder={dialog.placeholder || ''}
                  className="mt-5 w-full h-11 bg-[#1a2540] border border-cyan-400/15 rounded-xl px-4 text-sm font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                />
              )}

              {/* actions */}
              <div className="mt-7 flex gap-3 justify-end">
                {dialog.type !== 'alert' && (
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 transition-all"
                  >
                    {dialog.cancelLabel || 'Cancel'}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={cn(
                    'px-6 py-2.5 rounded-xl text-sm font-black text-white shadow-lg transition-all',
                    cfg.btn
                  )}
                >
                  {dialog.confirmLabel || (dialog.type === 'alert' ? 'OK' : 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export const useDialog = () => {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within <DialogProvider>')
  return ctx
}
