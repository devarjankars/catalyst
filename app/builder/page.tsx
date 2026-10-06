"use client"

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft, Save, FileText, RotateCcw, Lock, LayoutTemplate, Undo2, Redo2, HistoryIcon, Pencil, Check, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useEmailBuilderStore } from "@/store/email-builder-store";
import { firebaseService } from "@/services/firebase-service";
import { toast } from "sonner";
import { useAutoSave, clearAutoSave, getAutoSave } from "@/hooks/use-auto-save";
import { useDebouncedUpdate } from "@/hooks/use-debounced-update";
import { matchesBrand } from "@/lib/brand-filter"
import type { EmailVersion } from "@/types/template"
import { useLoggedInUserStore } from "@/store/logged-in-user";
import { generateEmailHTML } from "@/lib/email-generator";

// ── Lazy-loaded panels (kept out of the initial bundle) ────────────────────
import React from "react";
// EmailCanvas uses forwardRef internally, so we import it directly to preserve
// ref forwarding. next/dynamic's LoadableComponent wrapper drops refs even with
// the React.forwardRef workaround, causing the console warning.
import { EmailCanvas } from "@/components/email-canvas";
const ComponentPalette = nextDynamic(
  () => import("@/components/component-palette").then((m) => ({ default: m.ComponentPalette })),
  { ssr: false, loading: () => <BuilderPanelShimmer className="w-72" /> }
);
const PropertiesPanel = nextDynamic(
  () => import("@/components/properties-panel").then((m) => ({ default: m.PropertiesPanel })),
  { ssr: false, loading: () => <BuilderPanelShimmer className="w-80" /> }
);
const ExportPanel = nextDynamic(
  () => import("@/components/export-panel").then((m) => ({ default: m.ExportPanel })),
  { ssr: false }
);
const SaveTemplateDialog = nextDynamic(
  () => import("@/components/save-template-dialog").then((m) => ({ default: m.SaveTemplateDialog })),
  { ssr: false }
);
const VersionHistoryPanel = nextDynamic(
  () => import("@/components/version-history-panel").then((m) => ({ default: m.VersionHistoryPanel })),
  { ssr: false }
);
const UnsavedChangesDialog = nextDynamic(
  () => import("@/components/unsaved-changes-dialog").then((m) => ({ default: m.UnsavedChangesDialog })),
  { ssr: false }
);
const EmailPreviewModal = nextDynamic(
  () => import("@/components/email-previw-dalog"),
  { ssr: false }
);
const EditorModeDialog = nextDynamic(
  () => import("@/components/editor-mode-dialog").then((m) => ({ default: m.EditorModeDialog })),
  { ssr: false }
);

// ── Shimmer placeholder for panels while they load ────────────────────────
function BuilderPanelShimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
      <div className="p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" style={{ opacity: 1 - i * 0.09 }} />
        ))}
      </div>
    </div>
  );
}

export default function EmailBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const isCopy = searchParams.get("copy") === "true";
  const isEdit = searchParams.get("edit") === "true";
  const keepImages = searchParams.get("keepImages") === "true";
  const urlTemplateName = searchParams.get("name") || "";
  // Brand selected on the landing page — defaults to "orserdu" if not set
  const selectedBrand = (searchParams.get("brand") || "orserdu") as
    | "orserdu"
    | "ferring"
    | "idorsia"
    | "elzonris";

  const {
    currentTemplate,
    components,
    selectedComponent,
    previewMode,
    customComponents,
    hasComponentChanges,
    hasUnsavedTemplate,
    isNewTemplate,
    isWorkingCopy,
    workingCopySource,
    loading,
    saving,
    preheaderText,
    optionMode,
    optionSubMode,
    activeOption,
    option2Components,
    option3Components,
    setCurrentTemplate,
    setOriginalTemplate,
    setComponents,
    setOriginalComponents,
    startWorkingCopy,
    addComponent,
    updateComponent,
    deleteComponent,
    moveComponent,
    duplicateComponent,
    setSelectedComponent,
    setPreviewMode,
    addCustomComponent,
    setLoading,
    setSaving,
    markAsNewTemplate,
    resetComponentChanges,
    loadCustomComponents,
    loadTemplateImages,
    clearAll,
    setActiveOption,
    getActiveComponents,
    ensureThreeOptions,
    markComponentsSaved,
    applyOptionConfiguration,
    undo,
    redo,
    past,
    future,
  } = useEmailBuilderStore();

  const addComponentToOption = useEmailBuilderStore((s) => s.addComponentToOption);
  const renameTemplate = useEmailBuilderStore((s) => s.renameTemplate);
  const viewVersion = useEmailBuilderStore((s) => s.viewVersion);
  const exitVersionView = useEmailBuilderStore((s) => s.exitVersionView);
  const viewingVersion = useEmailBuilderStore((s) => s.viewingVersion);

  // ── Inline rename state ───────────────────────────────────────────────────
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = () => {
    if (viewingVersion) return;
    setRenameValue(currentTemplate?.name || workingCopySource?.name || "Untitled");
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 0);
  };

  const commitRename = () => {
    if (viewingVersion) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== currentTemplate?.name) {
      renameTemplate(trimmed);
      toast.success("Project renamed");
    }
    setIsRenaming(false);
  };

  const cancelRename = () => setIsRenaming(false);

  // ── Version history state ─────────────────────────────────────────────────
  // rightTab drives the unified right panel (Properties vs Versions)
  const [rightTab, setRightTab] = useState<"properties" | "versions" | "source">("versions");
  const [versions, setVersions] = useState<EmailVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [showCreateVersionModal, setShowCreateVersionModal] = useState(false);
  const [versionChangeNote, setVersionChangeNote] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);
  const [sourceOption, setSourceOption] = useState<1 | 2 | 3>(1);
  const sourceHtml = useMemo(() => {
    if (viewingVersion) {
      if (sourceOption === 2) return viewingVersion.sourceHtml2 || viewingVersion.sourceHtml || "";
      if (sourceOption === 3) return viewingVersion.sourceHtml3 || viewingVersion.sourceHtml || "";
      return viewingVersion.sourceHtml || "";
    }
    if (sourceOption === 2) return generateEmailHTML(option2Components, preheaderText);
    if (sourceOption === 3) return generateEmailHTML(option3Components, preheaderText);
    return generateEmailHTML(components, preheaderText);
  }, [viewingVersion, sourceOption, components, option2Components, option3Components, preheaderText]);


  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [awaitingModeSelection, setAwaitingModeSelection] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [createVsbAfterSave, setCreateVsbAfterSave] = useState(false);
  const [copyToDialogOpen, setCopyToDialogOpen] = useState(false);
  const [copyToTargets, setCopyToTargets] = useState<(1 | 2 | 3)[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [openPreview, setOpenPreview] = useState(false);

  // ── Auto-save: restore prompt ─────────────────────────────────────────────
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Check for a prior auto-save on first mount (before template is loaded)
  useEffect(() => {
    const saved = getAutoSave();
    if (saved && saved.components?.length > 0) {
      setShowRestoreBanner(true);
    }
  }, []);

  const handleRestoreAutoSave = () => {
    const saved = getAutoSave();
    if (!saved) return;
    setComponents(saved.components || []);
    toast.success("Draft restored from auto-save");
    setShowRestoreBanner(false);
    clearAutoSave();
  };

  const handleDismissRestore = () => {
    clearAutoSave();
    setShowRestoreBanner(false);
  };

  // Run the builder initialization only ONCE per mount. The URL is rewritten
  // after mode selection (history.replaceState), which changes `searchParams`
  // and would otherwise re-run this effect and reset the chosen option mode.
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const mode = searchParams.get("mode");
    const selectMode = searchParams.get("selectMode") === "true";
    const urlOptionMode = mode === "three" ? ("three" as const) : undefined;
    const urlOptionSubMode = searchParams.get("subMode") as
      | "header-only"
      | "completely-different"
      | null;
    const restoreVersionId = searchParams.get("restoreVersion");

    // ── Restore a specific saved version into the editor ─────────────────
    if (restoreVersionId && templateId) {
      (async () => {
        setLoading(true);
        try {
          const [template, version] = await Promise.all([
            firebaseService.getTemplate(templateId),
            firebaseService.getVersion(restoreVersionId),
          ]);
          if (template && version) {
            const snapshot = version.editorSnapshot;
            const restoredTemplate = {
              ...template,
              ...snapshot.settings,
              ...snapshot.metadata,
              components: snapshot.components || [],
              option2Components: snapshot.option2Components || [],
              option3Components: snapshot.option3Components || [],
              optionMode: snapshot.optionMode || "single",
              optionSubMode: snapshot.optionSubMode || "header-only",
              preheaderText: snapshot.preheaderText || "",
            };
            setCurrentTemplate(restoredTemplate);
            setOriginalTemplate(template);
            setComponents(snapshot.components || []);
            setOriginalComponents(template.components || []);
            applyOptionConfiguration({
              mode: snapshot.optionMode || "single",
              subMode: snapshot.optionSubMode || "header-only",
            });
            useEmailBuilderStore.setState({
              option2Components: snapshot.option2Components || [],
              option3Components: snapshot.option3Components || [],
              originalOption2Components: template.option2Components || [],
              originalOption3Components: template.option3Components || [],
              preheaderText: snapshot.preheaderText || "",
              hasComponentChanges: true,
            });
            const { useVSBStore } = await import("@/store/vsb-store");
            if (snapshot.vsbData) {
              const { sourcVsbId: _sourceVsbId, ...vsbData } = snapshot.vsbData;
              const restoredVsb = await firebaseService.createVSB({ templateId, ...vsbData });
              useVSBStore.getState().setCurrentVsb(restoredVsb);
            } else {
              useVSBStore.getState().setCurrentVsb(null);
            }
            toast.success(`v${version.versionNumber} loaded — save to create a new version`);
            // Load version list for this template
            loadVersions(templateId);
          }
        } catch (error) {
          console.error("Failed to restore email version as draft:", error);
          toast.error(error instanceof Error ? error.message : "Could not restore this version as a draft.");
        } finally {
          setLoading(false);
        }
        const getCustomComponents = async () => {
          const cc = await firebaseService.getCustomComponents();
          loadCustomComponents(cc);
        };
        getCustomComponents();
        loadTemplateImages(templateId);
      })();
      return;
    }

    if (selectMode && !isEdit) {
      setModeDialogOpen(true);
      setAwaitingModeSelection(true);
      if (!templateId) {
        markAsNewTemplate();
      }
    } else if (templateId) {
      loadTemplate(
        templateId,
        urlOptionMode
          ? {
              optionMode: urlOptionMode,
              optionSubMode: urlOptionSubMode || undefined,
            }
          : undefined,
      );
    } else {
      markAsNewTemplate();
    }

    const getCustomComponents = async () => {
      const customComponents = await firebaseService.getCustomComponents();
      loadCustomComponents(customComponents);
    };

    if (templateId && !(selectMode && !isEdit)) {
      loadTemplateImages(templateId);
    }

    getCustomComponents();
  }, [templateId, searchParams, isEdit]);

  // console.log(selectedComponent, "selected component in builder");
  

  // Handle browser back button and navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasComponentChanges || hasUnsavedTemplate) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasComponentChanges, hasUnsavedTemplate]);

  // Global undo/redo shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewingVersion) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, viewingVersion]);

const PLACEHOLDER_IMAGE = "/placeholder.svg?";

function replaceImagesInComponents(components: any[]): any[] {
  return components.map((comp) => {
    const newComp = { ...comp };

    // Handle standard image components and others with src
    if (
      (newComp.type === "image" ||
        newComp.type === "header-image" ) &&
      newComp.src
    ) {
      newComp.src = PLACEHOLDER_IMAGE;
    }

    // Handle CTA button images
    if (newComp.type === "cta-button" && newComp.imageSrc) {
      newComp.imageSrc = PLACEHOLDER_IMAGE;
    }

    // Handle footer tokens user photo
    if (
      newComp.type === "footer-tokens" &&
      newComp.footerTokens?.userPhoto
    ) {
      newComp.footerTokens = {
        ...newComp.footerTokens,
        userPhoto: PLACEHOLDER_IMAGE,
      };
    }

    // Recursively handle children
    if (Array.isArray(newComp.children) && newComp.children.length > 0) {
      newComp.children = replaceImagesInComponents(newComp.children);
    }

    return newComp;
  });
}

  const loadTemplate = async (
    id: string,
    optionOverrides?: {
      optionMode: "single" | "three";
      optionSubMode?: "header-only" | "completely-different";
    },
  ): Promise<void> => {
    setLoading(true);
    try {
      const template = await firebaseService.getTemplate(id);
      if (template) {
        const templateWithPlaceholders = isCopy && !keepImages
          ? {
              ...template,
              components: replaceImagesInComponents(template.components || []),
              option2Components: template.option2Components
                ? replaceImagesInComponents(template.option2Components)
                : undefined,
              option3Components: template.option3Components
                ? replaceImagesInComponents(template.option3Components)
                : undefined,
            }
          : template;

        if (isCopy) {
          startWorkingCopy(templateWithPlaceholders, optionOverrides);
        } else if (isEdit) {
          setCurrentTemplate(template);
          setOriginalTemplate(template);
          if (optionOverrides) {
            applyOptionConfiguration({
              mode: optionOverrides.optionMode,
              subMode: optionOverrides.optionSubMode,
            });
          }
          // Load version history for edit mode
          loadVersions(template.id);
        } else {
          startWorkingCopy(templateWithPlaceholders, optionOverrides);
        }

        if (!optionOverrides && (template.optionMode || "single") === "three") {
          ensureThreeOptions();
        }
      } else if (optionOverrides) {
        // Template could not be loaded — still apply the chosen configuration
        // so the editor doesn't get stuck in the wrong mode.
        applyOptionConfiguration({
          mode: optionOverrides.optionMode,
          subMode: optionOverrides.optionSubMode,
        });
      }
    } catch (error) {
      console.error("Failed to load template:", error);
      if (optionOverrides) {
        // Even on failure, apply the chosen configuration so the editor
        // doesn't get stuck in the wrong mode (e.g. tabs never appearing).
        applyOptionConfiguration({
          mode: optionOverrides.optionMode,
          subMode: optionOverrides.optionSubMode,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Version history functions ─────────────────────────────────────────────
  const loadVersions = useCallback(async (tId: string) => {
    setVersionsLoading(true);
    try {
      const vlist = await firebaseService.getVersions(tId);
      if (vlist.length === 0) throw new Error("No version history is available for this email.");
      setVersions(vlist);
    } catch (error) {
      console.error("Failed to load email versions:", error);
      toast.error("Could not load version history.");
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  const handleCreateVersion = async (note?: string) => {
    if (!currentTemplate || viewingVersion) return;
    if (!(note ?? versionChangeNote).trim()) {
      toast.error("Enter a change note before creating a version.");
      return;
    }
    setSavingVersion(true);
    try {
      const html1 = generateEmailHTML(components, preheaderText);
      const html2 = optionMode !== "single" ? generateEmailHTML(option2Components, preheaderText) : undefined;
      const html3 = optionMode === "three" ? generateEmailHTML(option3Components, preheaderText) : undefined;
      const nextNum = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
      const userEmail = useLoggedInUserStore.getState().userEmail;
      const changeNote = (note ?? versionChangeNote).trim() || `Version ${nextNum}`;

      const { useVSBStore } = await import("@/store/vsb-store");
      const vsbState = useVSBStore.getState();
      const activeVsb = vsbState.currentVsb?.templateId === currentTemplate.id
        ? vsbState.currentVsb
        : [...await firebaseService.getVSBs(currentTemplate.id)].sort((a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
          )[0] || null;
      const { id, components: _components, option2Components: _option2, option3Components: _option3,
        optionMode: _optionMode, optionSubMode: _optionSubMode, preheaderText: _preheader,
        name, description, category, brand, thumbnail, html, isUserCreated, createdAt, updatedAt,
        currentVersionId, ...settings } = currentTemplate;

      const v = await firebaseService.createVersion({
        templateId: currentTemplate.id,
        versionNumber: nextNum,
        changeNote,
        createdBy: userEmail || "",
        createdAt: new Date(),
        editorSnapshot: {
          components,
          option2Components: option2Components || [],
          option3Components: option3Components || [],
          optionMode: optionMode || "single",
          optionSubMode: optionSubMode || "header-only",
          preheaderText: preheaderText || "",
          metadata: { name, description, category, brand, thumbnail, html, isUserCreated },
          settings,
          ...(activeVsb ? {
            vsbData: {
              name: activeVsb.name,
              variableCopy: activeVsb.variableCopy || [],
              variableCopyHeadingColor: activeVsb.variableCopyHeadingColor,
              altNamePage: activeVsb.altNamePage || { images: [] },
              headerDetails: activeVsb.headerDetails || [],
              desktopView: activeVsb.desktopView || [],
              mobileView: activeVsb.mobileView || [],
              sourcVsbId: activeVsb.id,
            },
          } : {}),
        },
        sourceHtml: html1,
        sourceHtml2: html2,
        sourceHtml3: html3,
      });
      if (v) {
        setVersions((prev) => [...prev, v]);
        const savedTemplate = {
          ...currentTemplate,
          components,
          option2Components: option2Components || [],
          option3Components: option3Components || [],
          optionMode: optionMode || "single",
          optionSubMode: optionSubMode || "header-only",
          preheaderText: preheaderText || "",
          currentVersionId: v.id,
          updatedAt: new Date(),
        };
        setCurrentTemplate(savedTemplate);
        setOriginalTemplate(savedTemplate);
        markComponentsSaved();
        toast.success(`v${nextNum} created`);
        setShowCreateVersionModal(false);
        setVersionChangeNote("");
        // Show the version in the panel
        setRightTab("versions");
      } else {
        throw new Error("Could not save the email version.");
      }
    } catch (error) {
      console.error("Failed to create email version:", error);
      toast.error(error instanceof Error ? error.message : "Could not create the email version.");
    } finally {
      setSavingVersion(false);
    }
  };

  const handleVersionExportHtml = (v: EmailVersion) => {
    const html = v.sourceHtml || "";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${v.editorSnapshot.metadata.name || "email"}_v${v.versionNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVersionPreview = (v: EmailVersion) => {
    const html = v.sourceHtml || "";
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleVersionExportPdf = async (v: EmailVersion) => {
    if (!v.sourceHtml) {
      toast.error("This version has no saved source HTML to export.");
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:600px;height:1200px;border:0";
    try {
      const loaded = new Promise<void>((resolve, reject) => {
        iframe.onload = () => resolve();
        iframe.onerror = () => reject(new Error("Could not load version HTML for PDF export."));
      });
      iframe.srcdoc = v.sourceHtml;
      document.body.appendChild(iframe);
      await loaded;
      const { exportToPDF } = await import("@/lib/pdf-export-utils");
      await exportToPDF(
        iframe,
        `${v.editorSnapshot.metadata.name || currentTemplate?.name || "email"}_v${v.versionNumber}`,
        "desktop",
      );
    } catch (error) {
      console.error("Version PDF export failed:", error);
      toast.error(error instanceof Error ? error.message : "Could not export this version as PDF.");
    } finally {
      iframe.remove();
    }
  };

  const handleVersionRestoreAsDraft = (v: EmailVersion) => {
    if (currentTemplate) {
      router.push(`/builder?template=${currentTemplate.id}&edit=true&brand=${selectedBrand}&restoreVersion=${v.id}`);
    }
  };

  const handleViewVersion = (v: EmailVersion) => {
    viewVersion(v);
    setSourceOption(1);
    toast.info(`Viewing v${v.versionNumber} — canvas is read-only`);
  };

  const handleExitVersionView = () => {
    exitVersionView();
  };

  const handleVersionCreateVsb = (v: EmailVersion) => {
    if (currentTemplate) {
      // Navigate to VSB page — VSB page will read from the version snapshot
      router.push(`/vsb/${currentTemplate.id}?versionId=${v.id}`);
    }
  };

  const handleBackToDashboard = () => {
    const dashboardUrl = `/dashboard?brand=${selectedBrand}`;
    if (hasComponentChanges || hasUnsavedTemplate) {
      setPendingNavigation(dashboardUrl);
      setUnsavedDialog(true);
    } else {
      clearAll();
      router.push(dashboardUrl);
    }
  };

  const openModeDialog = () => {
    setModeDialogOpen(true);
  };

  const handleModeSelect = async (
    mode: "single" | "two" | "three",
    subMode?: "header-only" | "completely-different",
  ) => {
    const shouldLoadTemplateFirst = Boolean(templateId && awaitingModeSelection);
    setModeDialogOpen(false);
    setAwaitingModeSelection(false);

    const optionOverrides =
      mode === "three" || mode === "two"
        ? {
            optionMode: mode as "two" | "three",
            optionSubMode: subMode || ("header-only" as const),
          }
        : { optionMode: "single" as const };

    if (shouldLoadTemplateFirst && templateId) {
      await loadTemplate(templateId, optionOverrides as any);
      await loadTemplateImages(templateId);
    } else {
      applyOptionConfiguration({ mode, subMode });
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("selectMode");
    if (mode === "three" || mode === "two") {
      params.set("mode", mode);
      if (subMode) {
        params.set("subMode", subMode);
      } else {
        params.delete("subMode");
      }
    } else {
      params.delete("mode");
      params.delete("subMode");
    }

    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

    // Force save template after mode selection
    setSaveTemplateDialog(true);
  };



  const handleUnsavedChangesAction = async (
    action: "save" | "discard" | "cancel"
  ) => {
    if (action === "cancel") {
      setUnsavedDialog(false);
      setPendingNavigation(null);
      return;
    }

    if (action === "save") {
      if (hasUnsavedTemplate || isWorkingCopy) {
        // Need to save as template first
        setUnsavedDialog(false);
        setSaveTemplateDialog(true);
        return;
      }

      if (hasComponentChanges && currentTemplate) {
        // Save component changes to existing template
        await handleSaveComponentChanges();
      }
    }

    // Navigate after saving or discarding
    if (pendingNavigation) {
      clearAll();
      router.push(pendingNavigation);
    }
    setUnsavedDialog(false);
    setPendingNavigation(null);
  };



  const handleSaveComponentChanges = async () => {
    if (!currentTemplate) return false;

    setSaving(true);
    try {
      const updatedTemplate = await firebaseService.updateTemplate(
        currentTemplate.id,
        {
          name: currentTemplate.name,
          description: currentTemplate.description,
          category: currentTemplate.category,
          brand: currentTemplate.brand,
          thumbnail: currentTemplate.thumbnail,
          html: currentTemplate.html,
          isUserCreated: currentTemplate.isUserCreated,
          components,
          optionMode,
          optionSubMode,
          option2Components,
          option3Components,
          preheaderText,
          updatedAt: new Date(),
        }
      );

      if (!updatedTemplate) throw new Error('Failed to save emailer');
      setCurrentTemplate(updatedTemplate);
      setOriginalTemplate(updatedTemplate);
      markComponentsSaved();
      return true;
    } catch (error) {
      console.error("Failed to save component changes:", error);
      alert("Failed to save changes. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (
    name: string,
    description: string,
    category: string,
    brand: "orserdu" | "ferring" | "idorsia" | "elzonris"
  ) => {
    setSaving(true);
    try {
      const normalizedName = name.trim().toLowerCase();
      const existingTemplates = await firebaseService.getAllTemplates();
      const duplicate = existingTemplates.some((template) =>
        template.id !== currentTemplate?.id &&
        template.name.trim().toLowerCase() === normalizedName &&
        matchesBrand(template, brand)
      );

      if (duplicate) {
        toast.warning(`An emailer named "${name.trim()}" already exists for ${brand}. Please choose a different name.`);
        return;
      }

      let savedTemplate;
 
      if (isEdit && currentTemplate) {
        savedTemplate = await firebaseService.updateTemplate(
          currentTemplate.id,
          {
            name,
            description,
            category: category as any,
            brand,
            components,
            optionMode,
            optionSubMode,
            option2Components,
            option3Components,
            preheaderText,
          }
        );
      } else {
        savedTemplate = await firebaseService.createTemplate({
          name,
          description,
          category: category as any,
          brand,
          components,
          optionMode,
          optionSubMode,
          option2Components,
          option3Components,
          preheaderText,
          isUserCreated: true,
        });
      }

      if (!savedTemplate) throw new Error('Failed to save emailer');
      if (savedTemplate) {
        setCurrentTemplate(savedTemplate);
        setOriginalTemplate(savedTemplate);
        markComponentsSaved();
        setSavedTemplateId(savedTemplate.id);

        // Update URL to reflect saved template
        const newUrl = `/builder?template=${savedTemplate.id}&edit=true&brand=${brand}`;
        window.history.replaceState({}, "", newUrl);
      }

      setSaveTemplateDialog(false);
      clearAutoSave(); // explicit save succeeded — discard crash backup

      // If there was pending navigation after save, execute it
      if (pendingNavigation) {
        clearAll();
        router.push(pendingNavigation);
        setPendingNavigation(null);
      } else if (createVsbAfterSave || searchParams.get("createVsb") === "true") {
        // Auto-navigate to VSB if user chose "Create VSB" at the start
        const id = savedTemplate?.id;
        setCreateVsbAfterSave(false);
        if (id) router.push(`/vsb/${id}`);
      }
      // Otherwise just stay in builder — no extra prompt
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveAsCustomComponent = async (name?: string) => {
    if (!selectedComponentData) return;
    const customComponent = {
      ...selectedComponentData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      isCustom: true,
      name: name || selectedComponentData.name || `Custom ${selectedComponentData.type}`,
    };
    const saved = await addCustomComponent(customComponent);
    if (saved) {
      toast.success("Block saved to Saved Blocks");
    } else {
      toast.error("Failed to save block. Please try again.");
    }
  };

  function findComponentWithParentById(
  components: any[],
  targetId: string,
  parentId: string | null = null
): { component: any; parentId: string | null } | null {
  for (const comp of components) {
    if (!comp) continue; // Defensive check
    if (comp.id === targetId) {
      return { component: comp, parentId };
    }

    if (Array.isArray(comp.children)) {
      const found = findComponentWithParentById(comp.children, targetId, comp.id);
      if (found) return found;
    }
  }

  return null;
}


// Determine the currently active selected component and its parent
let activeSelectedId: string | null = selectedComponent;
let selectedComponentData: any = null;
let parentId: string | null = null;

if (activeSelectedId) {
  const activeComponentsArray = getActiveComponents();
  const found = findComponentWithParentById(activeComponentsArray, activeSelectedId);
  selectedComponentData = found?.component || null;
  parentId = found?.parentId || null;
} else {
  selectedComponentData = null;
  parentId = null;
}

  // ── Auto-save: run every 5s when there are unsaved changes ──────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useAutoSave(
    {
      components,
      option2Components,
      option3Components,
      preheaderText,
      templateId: currentTemplate?.id ?? null,
      templateName: currentTemplate?.name ?? workingCopySource?.name ?? null,
    },
    hasComponentChanges || hasUnsavedTemplate
  );

  // ── Debounced properties update ─────────────────────────────────────────
  // Capture latest ids in a ref so the debounced callback stays stable
  const activeIdRef = useRef(activeSelectedId);
  const parentIdRef = useRef(parentId);
  activeIdRef.current = activeSelectedId;
  parentIdRef.current = parentId;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { debouncedUpdate: debouncedUpdateComponent } = useDebouncedUpdate(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback((updates: any) => {
      if (!activeIdRef.current) return;
      updateComponent(activeIdRef.current, updates, parentIdRef.current);
    }, [updateComponent])
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50 animate-pulse">
        {/* Header shimmer */}
        <div className="bg-white border-b border-gray-200 h-14 flex items-center px-5 gap-3">
          <div className="h-8 w-20 bg-gray-200 rounded-full" />
          <div className="h-4 w-px bg-gray-200" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded-full" />
            <div className="h-8 w-16 bg-gray-200 rounded-full" />
            <div className="h-8 w-24 bg-gray-100 rounded-full" />
            <div className="h-8 w-20 bg-[#BC2030]/20 rounded-full" />
          </div>
        </div>
        {/* Panel area shimmer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel */}
          <div className="w-72 bg-white border-r border-gray-200 p-3 space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" style={{ opacity: 1 - i * 0.07 }} />
            ))}
          </div>
          {/* Canvas */}
          <div className="flex-1 bg-[#f0f2f5] flex items-start justify-center p-8">
            <div className="w-[600px] bg-white rounded-lg shadow-sm space-y-3 p-4">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
              <div className="h-10 w-32 bg-gray-200 rounded-full mx-auto" />
            </div>
          </div>
          {/* Right panel */}
          <div className="w-80 bg-white border-l border-gray-200 p-3 space-y-3">
            <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getHeaderTitle = () => {
    if (isWorkingCopy && workingCopySource) {
      return `${workingCopySource.name} (Working Copy)`;
    }
    if (currentTemplate) return currentTemplate.name;
    return "Untitled Template";
  };

  const getHeaderSubtitle = () => {
    if (isWorkingCopy)
      return "Working on a copy - save to create your template";
    if (isEdit && currentTemplate) return "Editing existing template";
    if (isNewTemplate) return "Creating new template";
    return "Template builder";
  };

  const isHeaderOnlyLocked =
    (optionMode === "three" || optionMode === "two") && optionSubMode === "header-only" && activeOption !== 1;

  const canSaveComponentChanges =
    currentTemplate && hasComponentChanges && !isWorkingCopy && !isNewTemplate && !viewingVersion;
  const needsTemplateSave = hasUnsavedTemplate || isWorkingCopy;

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Auto-save restore banner */}
        {showRestoreBanner && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <HistoryIcon className="w-4 h-4 shrink-0" />
              <span>An unsaved draft was found. Want to restore it?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleRestoreAutoSave}
              >
                Restore draft
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs text-amber-600 hover:bg-amber-100"
                onClick={handleDismissRestore}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
        {/* Header - sticky */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-0 flex items-center justify-between sticky top-0 z-30 h-12 gap-3">
          {/* Left: back + breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md h-7 px-2 text-xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>

            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />

            {/* Category breadcrumb */}
            <span className="text-xs text-gray-400 shrink-0 uppercase">
              {currentTemplate?.category || (selectedBrand === "elzonris" ? "Elzonris" : selectedBrand === "ferring" ? "Ferring" : selectedBrand === "idorsia" ? "Idorsia" : "Orserdu")}
            </span>

            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />

            {/* Inline rename */}
            {isRenaming ? (
              <div className="flex items-center gap-1">
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  onBlur={commitRename}
                  className="h-6 rounded border border-blue-400 bg-white px-2 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[140px] max-w-[260px]"
                  autoFocus
                />
                <button onClick={commitRename} className="text-green-600 hover:text-green-700 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={cancelRename} className="text-gray-400 hover:text-gray-600 p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button
                onClick={startRename}
                className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors min-w-0"
                title="Rename project"
              >
                <span className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">
                  {currentTemplate?.name || workingCopySource?.name || "Untitled"}
                </span>
                <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            {/* Status badges */}
            {hasComponentChanges && !viewingVersion && (
              <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full font-medium shrink-0">Unsaved changes</span>
            )}
            {isWorkingCopy && (
              <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-1.5 py-0.5 rounded-full font-medium shrink-0">Copy</span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => undo()} disabled={past.length === 0 || !!viewingVersion}
              title="Undo (Ctrl+Z)" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800 disabled:opacity-30">
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => redo()} disabled={future.length === 0 || !!viewingVersion}
              title="Redo (Ctrl+Shift+Z)" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-800 disabled:opacity-30">
              <Redo2 className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-gray-200" />

            {/* Version history toggle — always visible in edit mode */}
            {currentTemplate && isEdit && (
              <>
                <Button
                  variant={rightTab === "source" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRightTab("source")}
                  title="Source HTML"
                  className="h-7 px-2.5 text-xs rounded-md text-gray-600"
                >
                  Source HTML
                </Button>
                <Button
                  variant={rightTab === "versions" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRightTab((t) => t === "versions" ? "properties" : "versions")}
                  title="Version History"
                  className={`h-7 px-2.5 text-xs rounded-md flex items-center gap-1.5 ${
                    rightTab === "versions"
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <HistoryIcon className="w-3.5 h-3.5" />
                  History
                  {versions.length > 0 && (
                    <span className="ml-0.5 text-[10px] font-bold px-1 py-0 rounded-full bg-amber-200 text-amber-900">
                      {versions.length}
                    </span>
                  )}
                </Button>
                <div className="h-4 w-px bg-gray-200" />
              </>
            )}

            <Button variant="outline" size="sm"
              className="h-7 px-2.5 text-xs rounded-md flex items-center gap-1.5 text-gray-600"
              disabled={loading || saving}
              onClick={async () => {
                const id = currentTemplate?.id || savedTemplateId;
                if (viewingVersion && id) {
                  router.push(`/vsb/${id}?versionId=${viewingVersion.id}`);
                  return;
                }
                if (!id || hasUnsavedTemplate || isWorkingCopy || isNewTemplate) {
                  setCreateVsbAfterSave(true); setSaveTemplateDialog(true); return;
                }
                if (hasComponentChanges && !(await handleSaveComponentChanges())) return;
                router.push(`/vsb/${id}`);
              }}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              VSB
            </Button>

            {hasComponentChanges && !isWorkingCopy && !viewingVersion && (
              <Button variant="ghost" size="sm" onClick={resetComponentChanges}
                className="h-7 px-2.5 text-xs rounded-md text-gray-500 hover:text-gray-800 flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3" />
                Reset
              </Button>
            )}

            {/* Save Draft — persists working changes without creating a version */}
            {canSaveComponentChanges && (
              <Button variant="outline" size="sm" onClick={() => handleSaveComponentChanges()} disabled={saving}
                className="h-7 px-2.5 text-xs rounded-md border-gray-300 flex items-center gap-1.5">
                {saving ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />Saving…</> : <><Save className="w-3 h-3" />Save Draft</>}
              </Button>
            )}

            {/* Create New Version — immutable snapshot */}
            {currentTemplate && isEdit && !isWorkingCopy && !viewingVersion && (
              <Button size="sm"
                variant="outline"
                onClick={() => setShowCreateVersionModal(true)}
                className="h-7 px-2.5 text-xs rounded-md border-amber-400 text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
              >
                <HistoryIcon className="w-3 h-3" />
                Create New Version
              </Button>
            )}

            {(!currentTemplate || isNewTemplate || isWorkingCopy) && <Button size="sm"
              variant={needsTemplateSave ? "default" : "outline"}
              onClick={() => setSaveTemplateDialog(true)}
              className={`h-7 px-2.5 text-xs rounded-md flex items-center gap-1.5 ${
                needsTemplateSave ? "bg-[#BC2030] hover:bg-[#a01c29] text-white border-0" : "border-gray-300"
              }`}
            >
              <FileText className="w-3 h-3" />
              {currentTemplate && !isNewTemplate && !isWorkingCopy ? "Update" : "Save"}
            </Button>}

            <Button size="sm" variant="outline" onClick={() => setOpenPreview(true)}
              className="h-7 px-2.5 text-xs rounded-md border-gray-300 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Preview
            </Button>

            <ExportPanel
              components={components}
              canvasRef={canvasRef}
              sourceHtmlByOption={viewingVersion ? {
                1: viewingVersion.sourceHtml,
                2: viewingVersion.sourceHtml2,
                3: viewingVersion.sourceHtml3,
              } : undefined}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Components panel */}
          {!previewMode && (
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <ComponentPalette
                  onAddComponent={addComponent}
                  customComponents={customComponents}
                  disabled={isHeaderOnlyLocked || !!viewingVersion}
                  selectedBrand={selectedBrand}
                  getSelectionInfo={() => {
                    return { components: getActiveComponents(), selectedComponent: activeSelectedId || selectedComponent }
                  }}
                  applyUpdates={(updates, parentId) => {
                    if (!activeSelectedId || viewingVersion) return
                    updateComponent(activeSelectedId, updates, parentId)
                  }}
                />
              </div>
            </div>
          )}

          {/* Canvas */}
          <div
            className={`flex-1 overflow-auto bg-[#f0f2f5] ${optionMode === "three" ? "pt-0" : ""} p-8 flex flex-col items-center`}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedComponent(null)
            }}>

            {currentTemplate && (
              <div className={`w-full max-w-[600px] mb-3 flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
                viewingVersion ? "bg-amber-50 border border-amber-200" : "bg-white border border-gray-200"
              }`}>
                <span className={`font-medium ${viewingVersion ? "text-amber-800" : "text-gray-700"}`}>
                  {currentTemplate.name} &nbsp;•&nbsp; {viewingVersion
                    ? `Viewing v${viewingVersion.versionNumber}`
                    : versions.length > 0 ? `Draft · v${versions[versions.length - 1].versionNumber} Current` : "Draft"}
                  {viewingVersion?.changeNote ? ` — ${viewingVersion.changeNote}` : ""}
                </span>
                {viewingVersion && (
                  <button
                    onClick={handleExitVersionView}
                    className="text-amber-700 hover:text-amber-900 hover:underline text-xs font-medium"
                  >
                    ← Back to draft
                  </button>
                )}
              </div>
            )}

            {(optionMode === "two" || optionMode === "three") && (
              <div className="mb-5 w-full max-w-[600px] sticky top-0 z-20 pt-4 pb-3 bg-[#f0f2f5]">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Tab row */}
                  <div className="flex border-b border-gray-100">
                    {(optionMode === "two" ? [1, 2] : [1, 2, 3] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setActiveOption(opt as 1 | 2 | 3)}
                        className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                          activeOption === opt
                            ? "text-[#BC2030] bg-red-50"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                      >
                        Option {opt}
                        {activeOption === opt && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BC2030] rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Info row */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                      {optionSubMode === "header-only" ? "Header only different" : "Completely different"}
                    </span>
                    {optionSubMode === "completely-different" && (() => {
                      const { syncFooterFromOption1 } = useEmailBuilderStore.getState()
                      const FOOTER_TYPES = new Set(['email-footer','footer-with-Preferences','footer-links','footer-links(3)','footer-link-2','footer-link-3','orsedu-footer','footer-tokens'])
                      const opt2Missing = !option2Components.some((c: any) => FOOTER_TYPES.has(c.type))
                      const opt3Missing = optionMode === "three" && !option3Components.some((c: any) => FOOTER_TYPES.has(c.type))
                      if (viewingVersion || (!opt2Missing && !opt3Missing)) return null
                      return (
                        <button
                          onClick={() => { syncFooterFromOption1(); toast.success("Footer copied to missing options") }}
                          className="text-[11px] text-[#BC2030] hover:underline font-medium"
                          title="Copy footer components from Option 1 into options that are missing them"
                        >
                          + Copy footer from Opt 1
                        </button>
                      )
                    })()}
                  </div>
                  {isHeaderOnlyLocked && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      Body synced from Option 1 — only the header image can be edited here.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="w-full flex justify-center">
              <EmailCanvas
                ref={canvasRef}
                components={getActiveComponents()}
                selectedComponent={selectedComponent}
                onSelectComponent={(id) => {
                  if (viewingVersion) return
                  if ((optionMode === "three" || optionMode === "two") && optionSubMode === "header-only" && activeOption !== 1) {
                     // Check if it's a header-image component
                     const comp = findComponentWithParentById(getActiveComponents(), id || "");
                     if (comp && comp.component.type !== "header-image") {
                        return; // Block selection of non-header elements in Option 2/3 header-only mode
                     }
                  }
                  setSelectedComponent(id)
                }}
                onUpdateComponent={updateComponent}
                onDeleteComponent={deleteComponent}
                onMoveComponent={moveComponent}
                previewMode={previewMode}
                duplicateComponent={duplicateComponent}
                addComponent={addComponent}
                isLockedMode={isHeaderOnlyLocked || !!viewingVersion}
                showCopyToOption={
                  (optionMode === "three" || optionMode === "two") && optionSubMode === "completely-different" && !!selectedComponent
                }
                onCopyToOptions={
                  (optionMode === "three" || optionMode === "two") && optionSubMode === "completely-different" && selectedComponent
                    ? () => {
                        setCopyToTargets([]);
                        setCopyToDialogOpen(true);
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Right Panel: Properties + Version History — always visible in edit mode */}
          {!previewMode && (selectedComponent || (currentTemplate && isEdit)) && (
            <div className="w-[272px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0">

              {/* Tab bar */}
              {currentTemplate && isEdit ? (
                <div className="flex border-b border-gray-100 shrink-0">
                  {(["properties", "source", "versions"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRightTab(tab)}
                      className={`flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                        rightTab === tab
                          ? "text-gray-900 border-b-2 border-amber-500"
                          : "text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      {tab === "properties" ? "Properties" : tab === "source" ? "Source HTML" : (
                        <span className="flex items-center justify-center gap-1">
                          Versions
                          {versions.length > 0 && (
                            <span className="text-[9px] font-bold px-1 py-0 rounded-full bg-amber-100 text-amber-700">{versions.length}</span>
                          )}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Properties</span>
                </div>
              )}

              {/* Properties tab */}
              {(rightTab === "properties") && (
                <div className="flex-1 overflow-y-auto">
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
                            <button onClick={commitRename} disabled={!!viewingVersion} className="text-green-600 p-0.5"><Check className="w-3 h-3" /></button>
                            <button onClick={cancelRename} className="text-gray-400 p-0.5"><X className="w-3 h-3" /></button>
                          </>
                        ) : (
                          <button onClick={startRename} disabled={!!viewingVersion} className="group flex items-center gap-1 min-w-0 flex-1">
                            <span className="text-xs font-medium text-gray-800 truncate">{currentTemplate.name}</span>
                            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
                          </button>
                        )}
                      </div>
                      {currentTemplate.category && (
                        <p className="text-[10px] text-gray-400 mt-1 capitalize">
                          {currentTemplate.category} &middot; {currentTemplate.brand || "--"}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedComponent ? (
                    <div className="p-3">
                      <PropertiesPanel
                        component={selectedComponentData}
                        onUpdateComponent={(updates) => {
                          if (!activeSelectedId || viewingVersion) return;
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

              {currentTemplate && isEdit && rightTab === "source" && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-600">
                      {viewingVersion ? `v${viewingVersion.versionNumber} HTML` : "Draft HTML"}
                    </span>
                    {(optionMode === "two" || optionMode === "three") && (
                      <select
                        value={sourceOption}
                        onChange={(event) => setSourceOption(Number(event.target.value) as 1 | 2 | 3)}
                        className="h-7 rounded border border-gray-200 bg-white px-2 text-[11px]"
                        aria-label="Source HTML option"
                      >
                        {(optionMode === "two" ? [1, 2] : [1, 2, 3]).map((option) => (
                          <option key={option} value={option}>Option {option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <textarea
                    aria-label="Selected version source HTML"
                    readOnly
                    value={sourceHtml}
                    className="flex-1 min-h-0 resize-none border-0 bg-gray-50 p-3 font-mono text-[10px] leading-relaxed text-gray-700 focus:outline-none"
                  />
                </div>
              )}

              {/* Versions tab — unified VersionHistoryPanel */}
              {currentTemplate && isEdit && rightTab === "versions" && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <VersionHistoryPanel
                    versions={versions}
                    loading={versionsLoading}
                    viewingVersionId={viewingVersion?.id ?? null}
                    currentTemplateName={currentTemplate?.name ?? ""}
                    onViewVersion={handleViewVersion}
                    onExitVersionView={handleExitVersionView}
                    onRestoreAsDraft={handleVersionRestoreAsDraft}
                    onExportHtml={handleVersionExportHtml}
                    onPreview={handleVersionPreview}
                    onExportPdf={handleVersionExportPdf}
                    onCreateVsb={currentTemplate ? handleVersionCreateVsb : undefined}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Version Modal */}
      <Dialog open={showCreateVersionModal} onOpenChange={setShowCreateVersionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Saves an immutable snapshot of the current email state.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Change note (required)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="e.g. Updated CTA and ISI copy"
              value={versionChangeNote}
              onChange={(e) => setVersionChangeNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && versionChangeNote.trim() && !savingVersion && handleCreateVersion()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowCreateVersionModal(false); setVersionChangeNote(""); }}
              disabled={savingVersion}
            >
              Cancel
            </Button>
            <Button
              onClick={() => { void handleCreateVersion(); }}
              disabled={savingVersion || !currentTemplate || !versionChangeNote.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {savingVersion ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                  Saving…
                </>
              ) : (
                "Create Version"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveTemplateDialog}
        onClose={() => {
          setSaveTemplateDialog(false);
          setCreateVsbAfterSave(false);
        }}
        onSave={handleSaveTemplate}
        initialName={
          isWorkingCopy && urlTemplateName
            ? `${urlTemplateName} (Copy)`
            : currentTemplate?.name || workingCopySource?.name || ""
        }
        initialDescription={
          currentTemplate?.description || workingCopySource?.description || ""
        }
        initialCategory={
          currentTemplate?.category || workingCopySource?.category || "other"
        }
        initialBrand={
          (currentTemplate?.brand || workingCopySource?.brand || selectedBrand) as any
        }
        isEditing={isEdit && !!currentTemplate}
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={unsavedDialog}
        onAction={handleUnsavedChangesAction}
        templateName={
          currentTemplate?.name ||
          workingCopySource?.name ||
          "Untitled Template"
        }
        hasComponentChanges={hasComponentChanges}
        hasUnsavedTemplate={hasUnsavedTemplate}
      />

      <EditorModeDialog
        open={modeDialogOpen}
        onOpenChange={setModeDialogOpen}
        onSelectMode={handleModeSelect}
      />

      {/* Email Preview Modal */}
      <EmailPreviewModal
        components={components}
        open={openPreview}
        onOpenChange={setOpenPreview}
        sourceHtmlByOption={viewingVersion ? {
          1: viewingVersion.sourceHtml,
          2: viewingVersion.sourceHtml2,
          3: viewingVersion.sourceHtml3,
        } : undefined}
      />

      {/* Copy Component To Dialog */}
      <Dialog open={copyToDialogOpen} onOpenChange={setCopyToDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy selected component to…</DialogTitle>
            <DialogDescription>
              Select which option(s) should receive a copy of the selected component ({selectedComponentData?.type || "component"}).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {(optionMode === "two" ? [1, 2] as const : [1, 2, 3] as const).filter((o) => o !== activeOption).map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer rounded-md border p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  checked={copyToTargets.includes(opt)}
                  onChange={(e) => setCopyToTargets((prev) => {
                    const next: (1 | 2 | 3)[] = e.target.checked
                      ? [...prev, opt]
                      : prev.filter((target) => target !== opt);
                    return next;
                  })}
                />
                <span className="text-sm font-medium text-gray-800">Option {opt}</span>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCopyToDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={copyToTargets.length === 0}
              onClick={() => {
                if (!selectedComponentData) return;
                // Copy to the SAME position in the target option(s)
                const sourceIndex = getActiveComponents().findIndex((c) => c.id === activeSelectedId);
                const insertIndex = sourceIndex >= 0 ? sourceIndex : undefined;
                copyToTargets.forEach((opt) => {
                  addComponentToOption(selectedComponentData, opt, insertIndex);
                });
                setCopyToDialogOpen(false);
                setCopyToTargets([]);
                toast.success(
                  `Component copied to Option${copyToTargets.length > 1 ? "s" : ""} ${copyToTargets.join(" & ")}`
                );
              }}
            >
              Apply Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
