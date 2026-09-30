$file = 'd:\eB\email_builder2\app\builder\page.tsx'
$content = Get-Content $file -Raw -Encoding UTF8

# ── 1. Add rightTab state after the showVersionPanel state declaration ──────
$content = $content -replace `
  '(const \[showVersionPanel, setShowVersionPanel\] = useState\(false\);)', `
  '$1' + "`r`n  const [rightTab, setRightTab] = useState<`"properties`" | `"versions`">(`"properties`");"

# ── 2. Replace both right panels with unified tabbed panel ───────────────────
$oldPanel = @'
          {/* Right Panel: Properties */}
          {!previewMode && selectedComponent && (
            <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Properties</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <PropertiesPanel
                  component={selectedComponentData}
                  onUpdateComponent={(updates) => {
                    if (!activeSelectedId) return;
                    debouncedUpdateComponent(updates);
                  }}
                  onSaveAsCustom={(name) => saveAsCustomComponent(name)}
                />
              </div>
            </div>
          )}
'@

# Find start of old panel block
$startIdx = $content.IndexOf('          {/* Right Panel: Properties */}')
# Find end: the closing of the version panel block
$endMarker = '          {/* Right Panel: Version History */}'
$endIdx = $content.IndexOf($endMarker)

# Find the closing )} of the version panel
$afterEnd = $content.IndexOf('        </div>' + "`r`n`r`n      </div>", $endIdx)
# Actually find the pattern: closing of version panel then closing of main flex div
$closePattern = "          )}`r`n        </div>`r`n`r`n      </div>"
$closeIdx = $content.IndexOf($closePattern, $endIdx)
if ($closeIdx -lt 0) {
    # try without \r
    $closePattern = "          )}`n        </div>`n`n      </div>"
    $closeIdx = $content.IndexOf($closePattern, $endIdx)
}

Write-Host "startIdx: $startIdx"
Write-Host "endIdx: $endIdx"
Write-Host "closeIdx: $closeIdx"

$newPanel = @'
          {/* Right Panel: unified Properties + Versions */}
          {!previewMode && (selectedComponent || showVersionPanel) && (
            <div className="w-[272px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0">

              {/* Tab bar — only when version panel toggled on */}
              {showVersionPanel ? (
                <div className="flex border-b border-gray-100 shrink-0">
                  {(["properties", "versions"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRightTab(tab)}
                      className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                        rightTab === tab
                          ? "text-gray-900 border-b-2 border-blue-500"
                          : "text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      {tab === "properties" ? "Properties" : "Versions"}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Properties</span>
                </div>
              )}

              {/* Properties tab */}
              {(!showVersionPanel || rightTab === "properties") && (
                <div className="flex-1 overflow-y-auto">
                  {/* File Details */}
                  {currentTemplate && (
                    <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">File</p>
                      <div className="flex items-center gap-1.5">
                        {isRenaming ? (
                          <>
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                              onBlur={commitRename}
                              className="flex-1 h-6 rounded border border-blue-400 bg-white px-2 text-xs font-medium text-gray-900 focus:outline-none"
                              autoFocus
                            />
                            <button onClick={commitRename} className="text-green-600 p-0.5"><Check className="w-3 h-3" /></button>
                            <button onClick={cancelRename} className="text-gray-400 p-0.5"><X className="w-3 h-3" /></button>
                          </>
                        ) : (
                          <button onClick={startRename} className="group flex items-center gap-1 min-w-0 flex-1">
                            <span className="text-xs font-medium text-gray-800 truncate">{currentTemplate.name}</span>
                            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
                          </button>
                        )}
                      </div>
                      {currentTemplate.category && (
                        <p className="text-[10px] text-gray-400 mt-1 capitalize">{currentTemplate.category} · {currentTemplate.brand || "—"}</p>
                      )}
                    </div>
                  )}
                  {selectedComponent ? (
                    <div className="p-3">
                      <PropertiesPanel
                        component={selectedComponentData}
                        onUpdateComponent={(updates) => {
                          if (!activeSelectedId) return;
                          debouncedUpdateComponent(updates);
                        }}
                        onSaveAsCustom={(name) => saveAsCustomComponent(name)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400">Select a component to edit its properties</p>
                    </div>
                  )}
                </div>
              )}

              {/* Versions tab */}
              {showVersionPanel && rightTab === "versions" && (
                <div className="flex-1 overflow-y-auto">
                  {versionsLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500" />
                      <span className="text-xs">Loading…</span>
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <HistoryIcon className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs text-gray-400">No versions yet.</p>
                      <p className="text-[11px] text-gray-400 mt-1">Click "Save Version" to snapshot the current state.</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1.5">
                      {[...versions].reverse().map((v, i) => {
                        const isActive = activeVersionId === v.id;
                        const isCurrent = i === 0;
                        return (
                          <div
                            key={v.id}
                            className={`rounded-lg border p-2.5 cursor-pointer transition-all ${
                              isActive ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                            onClick={() => handleViewVersion(v)}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isActive ? "bg-amber-200 text-amber-800" : "bg-gray-100 text-gray-600"
                              }`}>v{v.versionNumber}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold uppercase tracking-wide text-green-700 bg-green-100 px-1.5 py-0.5 rounded">CURRENT</span>
                              )}
                              <span className="text-[11px] font-medium text-gray-800 truncate flex-1">
                                {v.changeNote || `Version ${v.versionNumber}`}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {v.createdAt ? new Date(v.createdAt as any).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                              {v.createdBy && <> · {v.createdBy}</>}
                            </div>
                            {isActive && (
                              <div className="mt-2 pt-2 border-t border-amber-200 flex flex-wrap gap-1">
                                <button className="text-[10px] px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-600"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const { generateEmailHTML } = await import("@/lib/email-generator");
                                    const html = generateEmailHTML(v.components || [], v.preheaderText);
                                    const win = window.open("", "_blank");
                                    if (win) { win.document.write(html); win.document.close(); }
                                  }}>Preview</button>
                                <button className="text-[10px] px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const blob = new Blob([v.sourceHtml], { type: "text/html" });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url; a.download = `${v.name || "email"}_v${v.versionNumber}.html`;
                                    a.click(); URL.revokeObjectURL(url);
                                  }}>Export HTML</button>
                                <button
                                  className="text-[10px] px-2 py-0.5 rounded bg-[#006937] hover:bg-[#005229] text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (currentTemplate) {
                                      router.push(`/builder?template=${currentTemplate.id}&edit=true&brand=${selectedBrand}&restoreVersion=${v.id}`);
                                    }
                                  }}>Restore as Draft</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
'@

# Do the replacement
$before = $content.Substring(0, $startIdx)
# Find end of version panel block: look for the pattern after endIdx
$searchFrom = $endIdx
$endPattern = "          )}`r`n        </div>"
$endPos = $content.IndexOf($endPattern, $searchFrom)
if ($endPos -lt 0) {
    $endPattern = "          )}`n        </div>"
    $endPos = $content.IndexOf($endPattern, $searchFrom)
}
Write-Host "endPos: $endPos"
$after = $content.Substring($endPos + $endPattern.Length)

$newContent = $before + $newPanel.TrimEnd() + "`r`n        </div>"  + $after

[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Done"
