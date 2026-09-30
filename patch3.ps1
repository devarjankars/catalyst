$file = 'd:\eB\email_builder2\app\builder\page.tsx'
$c = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Replace the version indicator banner with a cleaner read-only banner
$old = @'
            {/* Version indicator banner */}
            {activeVersionId && currentTemplate && (
              <div className="w-full max-w-[600px] mb-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-amber-800 font-medium">
                  {currentTemplate.name} &nbsp;·&nbsp; Viewing v{versions.find((v) => v.id === activeVersionId)?.versionNumber ?? "?"}
                </span>
                <button
                  onClick={handleBackToCurrentDraft}
                  className="text-amber-700 hover:text-amber-900 hover:underline text-xs font-medium"
                >
                  ← Back to current
                </button>
              </div>
            )}
'@

$new = @'
            {/* Version indicator banner — read-only mode */}
            {activeVersionId && currentTemplate && (
              <div className="w-full max-w-[600px] mb-3 flex items-center justify-between bg-amber-50 border border-amber-300 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded">Read only</span>
                  <span className="text-xs text-amber-800 font-medium">
                    Viewing v{versions.find((v) => v.id === activeVersionId)?.versionNumber ?? "?"} · {currentTemplate.name}
                  </span>
                </div>
                <button
                  onClick={handleBackToCurrentDraft}
                  className="text-amber-700 hover:text-amber-900 hover:underline text-xs font-medium shrink-0"
                >
                  ← Back to current
                </button>
              </div>
            )}
'@

$c2 = $c.Replace($old, $new)

# Also lock the canvas when viewing an old version (pass isLockedMode=true)
$old2 = '                isLockedMode={isHeaderOnlyLocked}'
$new2 = '                isLockedMode={isHeaderOnlyLocked || !!activeVersionId}'
$c3 = $c2.Replace($old2, $new2)

[System.IO.File]::WriteAllText($file, $c3, [System.Text.Encoding]::UTF8)
Write-Host "Done"
