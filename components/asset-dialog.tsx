import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLoggedInUserStore } from "@/store/logged-in-user";
// import { Spinner } from "@/components/icons/spinner"; // optional: replace with your spinner/icon

// If your project doesn't have these icon/component paths, adjust imports to match your setup.

type Asset = {
    id: string;
    url: string;
    name?: string;
    width?: number;
    height?: number;
};

type AssetDialogProps = {
    clientId: string;
  
    triggerLabel?: string;
    open: boolean;
    onCLose: () => void;
};

export default function AssetDialog({ clientId,open, onCLose }: AssetDialogProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement | null>(null);

    const {userRole,userPermissions} = useLoggedInUserStore()

    useEffect(() => {
        if (!open) return;
        // fetchAssets();
        
    }, [open, clientId]);

    async function fetchAssets() {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/assets`);
            if (!res.ok) throw new Error("Failed to fetch assets");
            const data = await res.json();
            // Expecting data to be Asset[]
            setAssets(data || []);
        } catch (e) {
            console.error(e);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const form = new FormData();
            Array.from(files).forEach((f) => form.append("files", f));
            // POST to your backend. Adjust endpoint & method as needed.
            const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/assets`, {
                method: "POST",
                body: form,
            });
            if (!res.ok) throw new Error("Upload failed");
            // Optionally get new assets from response
            const newAssets: Asset[] | undefined = (await res.json()) ?? undefined;
            // Refresh assets list; prefer server returned items if provided
            if (newAssets && Array.isArray(newAssets)) {
                setAssets((prev) => [...newAssets, ...prev]);
            } else {
                await fetchAssets();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        handleFiles(e.target.files);
    }

    function triggerUpload() {
        fileRef.current?.click();
    }

    return (
        <Dialog open={open} onOpenChange={onCLose}>
            

            <DialogContent className="w-[90vw] max-w-4xl min-h-[60vh] grid-rows-[auto_auto_1fr]">
                <DialogHeader >
                    <DialogTitle>Assets for client {clientId}</DialogTitle>
                </DialogHeader>

                {userRole === "superadmin" || userPermissions?.includes("asset_library") ? <div className="flex items-center  h-[90%] justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={onFileInputChange}
                        />
                        <Button onClick={triggerUpload} disabled={uploading}>
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                     Uploading...
                                </span>
                            ) : (
                                "Upload images"
                            )}
                        </Button>
                        <Label className="text-sm text-muted-foreground">Supports multiple images</Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={fetchAssets} disabled={loading}>
                            {loading ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>
                </div> : <div></div>}

                <div className="mb-4">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">Loading assets...</div>
                    ) : assets.length === 0 ? (
                        <div className="py-10 text-center text-sm flex justify-center h-full text-muted-foreground">No assets uploaded yet</div>
                    ) : (
                        <ScrollArea className="h-[40vh]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                                {assets.map((a) => (
                                    <Card
                                        key={a.id}
                                        // onClick={() => {
                                        //     if (onSelect) onSelect(a);
                                        // }}
                                        className="cursor-pointer overflow-hidden"
                                    >
                                        <div className="relative w-full aspect-square bg-muted">
                                            <img
                                                src={a.url}
                                                alt={a.name ?? a.id}
                                                className="object-cover w-full h-full"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="px-2 py-1 text-xs truncate">{a.name ?? a.id}</div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                
            </DialogContent>
        </Dialog>
    );
}