import { Drawer } from '@base-ui/react/drawer'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAppData } from '../app/AppDataContext'
import type { LocalUser, PlanRecord, WorkMode } from '../domain/types'
import {
  createExportData,
  downloadExportData,
  readImportFile,
} from '../storage/importExport'
import { ConfirmDialog } from './ConfirmDialog'
import { CreateUserDialog } from './CreateUserDialog'

interface WorkspaceDrawerProps {
  onOpenPlan: (planId: string) => void
  onStartPlan: () => void
  onRestartTour: () => void
  onUserSelected: () => void
  onImported: (mode: WorkMode | null) => void
}

export function WorkspaceDrawer({
  onOpenPlan,
  onStartPlan,
  onRestartTour,
  onUserSelected,
  onImported,
}: WorkspaceDrawerProps) {
  const appData = useAppData()
  const [open, setOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [renamingPlanId, setRenamingPlanId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<PlanRecord | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<PlanRecord | null>(
    null,
  )
  const [deletePlanTarget, setDeletePlanTarget] = useState<PlanRecord | null>(
    null,
  )
  const [expandedArchivedUserId, setExpandedArchivedUserId] = useState<
    string | null
  >(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState<LocalUser | null>(
    null,
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activePlans = appData.activeUser.plans.filter(
    (plan) => plan.status === 'active',
  )
  const archivedPlans = appData.activeUser.plans.filter(
    (plan) => plan.status === 'archived',
  )
  const sortedArchivedPlans = [...archivedPlans].sort((left, right) =>
    (right.archivedAt ?? '').localeCompare(left.archivedAt ?? ''),
  )
  const archivedExpanded = expandedArchivedUserId === appData.activeUser.id
  const visibleArchivedPlans = archivedExpanded
    ? sortedArchivedPlans
    : sortedArchivedPlans.slice(0, 3)

  const renameUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('userName') ?? '')
    appData.renameUser(appData.activeUser.id, name)
  }

  const renamePlan = (event: FormEvent<HTMLFormElement>, planId: string) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (appData.renamePlan(planId, String(form.get('planName') ?? ''))) {
      setRenamingPlanId(null)
    }
  }

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.confirm('匯入會覆寫全部本機使用者與計畫，確定繼續？')) {
      return
    }
    try {
      const data = await readImportFile(file)
      if (!appData.replaceData(data)) return
      const user = data.users.find((item) => item.id === data.activeUserId)
      const selectedPlan = user?.plans.find(
        (plan) => plan.id === user.selectedPlanId,
      )
      const importedMode =
        user?.preferredMode === 'diary' && !selectedPlan
          ? user.quickDraft
            ? 'quick'
            : null
          : (user?.preferredMode ?? null)
      setOpen(false)
      onImported(importedMode)
      appData.notify('ok', '已匯入全部本機資料。')
    } catch (error) {
      setOpen(false)
      const message = error instanceof Error ? error.message : '無法讀取檔案'
      appData.notify('danger', `匯入失敗：${message}`)
    }
  }

  const renderPlan = (plan: PlanRecord) => (
    <div
      className={`workspace-plan-item${appData.selectedPlan?.id === plan.id ? ' selected' : ''}`}
      key={plan.id}
    >
      {renamingPlanId === plan.id ? (
        <form onSubmit={(event) => renamePlan(event, plan.id)}>
          <input
            name="planName"
            defaultValue={plan.name}
            maxLength={50}
            aria-label="計畫名稱"
          />
          <button type="submit">儲存</button>
          <button type="button" onClick={() => setRenamingPlanId(null)}>
            取消
          </button>
        </form>
      ) : (
        <>
          <button
            className="workspace-plan-main"
            type="button"
            onClick={() => {
              if (!appData.selectPlan(plan.id)) return
              setOpen(false)
              onOpenPlan(plan.id)
            }}
          >
            <strong>{plan.name}</strong>
            <small>{plan.profile?.target ?? '—'} kg</small>
          </button>
          <div className="workspace-plan-actions">
            {plan.status === 'active' ? (
              <>
                <button
                  type="button"
                  aria-label={`重新命名 ${plan.name}`}
                  onClick={() => setRenamingPlanId(plan.id)}
                >
                  編輯
                </button>
                <button
                  type="button"
                  aria-label={`封存 ${plan.name}`}
                  onClick={() => {
                    setOpen(false)
                    setArchiveTarget(plan)
                  }}
                >
                  封存
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setReactivateTarget(plan)
                  }}
                >
                  重新啟用
                </button>
                <button
                  className="workspace-delete-plan"
                  type="button"
                  aria-label={`刪除 ${plan.name}`}
                  onClick={() => {
                    setOpen(false)
                    setDeletePlanTarget(plan)
                  }}
                >
                  刪除
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      <Drawer.Root open={open} swipeDirection="left" onOpenChange={setOpen}>
        <Drawer.Trigger
          ref={triggerRef}
          className="data-menu-trigger"
          aria-label="開啟工作區選單"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop className="workspace-drawer-backdrop" />
          <Drawer.Viewport className="workspace-drawer-viewport">
            <Drawer.Popup className="workspace-drawer-popup">
              <header className="workspace-drawer-head">
                <div>
                  <span className="eyebrow">Workspace</span>
                  <Drawer.Title>本機使用者與計畫</Drawer.Title>
                </div>
                <Drawer.Close aria-label="關閉工作區選單">×</Drawer.Close>
              </header>

              <div className="workspace-drawer-scroll">
                <section className="workspace-section">
                  <span className="workspace-label">目前使用者</span>
                  <div className="workspace-user-list">
                    {appData.users.map((user) => (
                      <button
                        className={
                          user.id === appData.activeUser.id ? 'active' : ''
                        }
                        type="button"
                        key={user.id}
                        onClick={() => {
                          if (!appData.selectUser(user.id)) return
                          onUserSelected()
                        }}
                      >
                        {user.name}
                      </button>
                    ))}
                  </div>
                  <form
                    className="workspace-inline-form"
                    key={appData.activeUser.id}
                    onSubmit={renameUser}
                  >
                    <input
                      name="userName"
                      defaultValue={appData.activeUser.name}
                      maxLength={50}
                      aria-label="目前使用者名稱"
                    />
                    <button type="submit">改名</button>
                  </form>
                  <button
                    className="workspace-delete-user"
                    type="button"
                    disabled={appData.users.length <= 1}
                    title={
                      appData.users.length <= 1
                        ? '至少需要保留一位本機使用者'
                        : undefined
                    }
                    onClick={() => {
                      setOpen(false)
                      setDeleteUserTarget(appData.activeUser)
                    }}
                  >
                    刪除此使用者
                  </button>
                </section>

                <section className="workspace-section">
                  <div className="workspace-section-head">
                    <span className="workspace-label">目前正式計畫</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        onStartPlan()
                      }}
                    >
                      ＋ 新正式計畫
                    </button>
                  </div>
                  <div className="workspace-plan-list">
                    {activePlans.length ? (
                      activePlans.map(renderPlan)
                    ) : (
                      <p>尚無正式計畫</p>
                    )}
                  </div>
                </section>

                <section className="workspace-section">
                  <span className="workspace-label">已封存計畫</span>
                  <div className="workspace-plan-list">
                    {archivedPlans.length ? (
                      visibleArchivedPlans.map(renderPlan)
                    ) : (
                      <p>尚無已封存計畫</p>
                    )}
                  </div>
                  {archivedPlans.length > 3 ? (
                    <button
                      className={`workspace-archive-toggle${archivedExpanded ? ' expanded' : ''}`}
                      type="button"
                      aria-expanded={archivedExpanded}
                      aria-label={
                        archivedExpanded
                          ? '收合已封存計畫'
                          : '展開所有已封存計畫'
                      }
                      onClick={() =>
                        setExpandedArchivedUserId(
                          archivedExpanded ? null : appData.activeUser.id,
                        )
                      }
                    >
                      <span aria-hidden="true" />
                    </button>
                  ) : null}
                </section>

                <section className="workspace-section workspace-data-actions">
                  <span className="workspace-label">Data</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      downloadExportData(createExportData(appData))
                      appData.notify('ok', '已匯出全部本機資料 JSON。')
                    }}
                  >
                    匯出資料 JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                  >
                    匯入資料 JSON
                  </button>
                  <input
                    ref={inputRef}
                    className="data-menu-input"
                    type="file"
                    accept="application/json,.json"
                    onChange={importData}
                  />
                </section>

                <section className="workspace-section workspace-tour-actions">
                  <span className="workspace-label">Help</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      window.setTimeout(onRestartTour, 0)
                    }}
                  >
                    重新開始新手教學
                  </button>
                </section>

                <div className="workspace-add-user-row">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setCreateUserOpen(true)
                    }}
                  >
                    ＋ 新增使用者
                  </button>
                </div>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <ConfirmDialog
        open={archiveTarget !== null}
        title="封存這個計畫？"
        description="封存後計畫會變成唯讀；仍可查看紀錄或重新啟用。"
        confirmLabel="確認封存"
        finalFocus={triggerRef}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) appData.archivePlan(archiveTarget.id)
          setArchiveTarget(null)
        }}
      />
      <ConfirmDialog
        open={deletePlanTarget !== null}
        title="永久刪除封存計畫？"
        description={
          deletePlanTarget
            ? `「${deletePlanTarget.name}」的全部日記、飲食、運動與體重紀錄將永久刪除
此操作無法復原`
            : ''
        }
        confirmLabel="永久刪除"
        finalFocus={triggerRef}
        onCancel={() => setDeletePlanTarget(null)}
        onConfirm={() => {
          if (deletePlanTarget) {
            const wasSelected = appData.selectedPlan?.id === deletePlanTarget.id
            const fallbackPlan = activePlans[0] ?? null
            if (appData.deletePlan(deletePlanTarget.id) && wasSelected) {
              if (fallbackPlan) {
                onOpenPlan(fallbackPlan.id)
              } else {
                onUserSelected()
              }
            }
          }
          setDeletePlanTarget(null)
        }}
      />
      <ConfirmDialog
        open={deleteUserTarget !== null}
        title="永久刪除使用者？"
        description={
          deleteUserTarget
            ? `「${deleteUserTarget.name}」的 Quick 草稿、${deleteUserTarget.plans.length} 個計畫、全部日記與成就都會永久刪除，此操作無法復原。`
            : ''
        }
        confirmLabel="永久刪除"
        finalFocus={triggerRef}
        onCancel={() => setDeleteUserTarget(null)}
        onConfirm={() => {
          if (deleteUserTarget && appData.deleteUser(deleteUserTarget.id)) {
            onUserSelected()
          }
          setDeleteUserTarget(null)
        }}
      />
      <ConfirmDialog
        open={reactivateTarget !== null}
        title="重新啟用計畫？"
        description={
          reactivateTarget
            ? `${
                activePlans[0] ? `${activePlans[0].name}將封存為唯讀\n` : ''
              }${reactivateTarget.name}將恢復為目前正式計畫
全部日記與體重會完整保留`
            : ''
        }
        confirmLabel="確認重新啟用"
        finalFocus={triggerRef}
        onCancel={() => setReactivateTarget(null)}
        onConfirm={() => {
          if (reactivateTarget && appData.reactivatePlan(reactivateTarget.id)) {
            onOpenPlan(reactivateTarget.id)
          }
          setReactivateTarget(null)
        }}
      />
      {createUserOpen ? (
        <CreateUserDialog
          finalFocus={triggerRef}
          onCancel={() => setCreateUserOpen(false)}
          onCreate={(name) => {
            const userId = appData.createUser(name)
            if (!userId) return false
            setCreateUserOpen(false)
            onUserSelected()
            return true
          }}
        />
      ) : null}
    </>
  )
}
