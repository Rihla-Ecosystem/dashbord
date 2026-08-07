"use client";

import { useState, useCallback } from "react";
import {
  HiOutlineDatabase,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineRefresh,
} from "react-icons/hi";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollections, usePoints, useDeleteCollection, useDeletePoint } from "@/hooks/useVectorDb";
import { vectorDbApi } from "@/services/api";
import { toast } from "sonner";

function truncateText(text: string, maxLen: number = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

export default function VectorDbPage() {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [pointOffset, setPointOffset] = useState(0);
  const [pointLimit] = useState(20);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("uploaded");
  const [uploadCollection, setUploadCollection] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "collection" | "point";
    name: string;
    id?: number;
  } | null>(null);

  const {
    data: collections,
    isLoading: collectionsLoading,
    error: collectionsError,
    refetch: refetchCollections,
  } = useCollections();

  const {
    data: pointsData,
    isLoading: pointsLoading,
    error: pointsError,
    refetch: refetchPoints,
  } = usePoints(selectedCollection ?? "", {
    offset: pointOffset,
    limit: pointLimit,
  });

  const deleteCollection = useDeleteCollection();
  const deletePoint = useDeletePoint();

  const handleCollectionSelect = useCallback((name: string) => {
    setSelectedCollection(name);
    setPointOffset(0);
  }, []);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      if (uploadCollection.trim()) {
        formData.append("collection", uploadCollection.trim());
      }
      await vectorDbApi.uploadFile(formData);
      toast.success(`File uploaded successfully`);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadCategory("uploaded");
      setUploadCollection("");
      refetchCollections();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCollection.mutateAsync(deleteConfirm.name);
      setDeleteConfirm(null);
      if (selectedCollection === deleteConfirm.name) {
        setSelectedCollection(null);
      }
      refetchCollections();
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  const handleDeletePoint = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "point" || deleteConfirm.id === undefined) return;
    try {
      await deletePoint.mutateAsync({
        collectionName: deleteConfirm.name,
        pointId: deleteConfirm.id,
      });
      setDeleteConfirm(null);
      refetchPoints();
    } catch {
      toast.error("Failed to delete point");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vector Database"
        description="Manage Qdrant collections, upload data files, and browse stored vectors"
      >
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger render={
            <Button variant="default" className="rounded-xl">
              <HiOutlineUpload className="size-4" /> Upload File
            </Button>
          }>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle>Upload File to Vector DB</DialogTitle>
              <DialogDescription>
                Upload a JSON, Markdown, or Text file to be chunked, embedded,
                and stored in Qdrant.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="upload-file">File</label>
                <Input
                  id="upload-file"
                  type="file"
                  accept=".json,.md,.markdown,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="upload-category">Category</label>
                <Input
                  id="upload-category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  placeholder="e.g. uploaded, attractions"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="upload-collection">Collection (optional)</label>
                <Input
                  id="upload-collection"
                  value={uploadCollection}
                  onChange={(e) => setUploadCollection(e.target.value)}
                  placeholder="Defaults to rihla_{category}"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {collectionsError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load collections:{" "}
              {collectionsError instanceof Error
                ? collectionsError.message
                : "Unknown error"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetchCollections()}
            >
              <HiOutlineRefresh className="size-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Collections List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {collectionsLoading ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : collections && collections.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No collections found
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-0.5 p-2">
                    {collections?.map((col) => (
                      <button
                        key={col.name}
                        onClick={() => handleCollectionSelect(col.name)}
                        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedCollection === col.name
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <HiOutlineDatabase className="size-4 shrink-0" />
                        <span className="truncate flex-1">
                          {col.name.replace(/^rihla_/, "")}
                        </span>
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                          {col.points_count}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Points Detail */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {selectedCollection
                    ? selectedCollection.replace(/^rihla_/, "")
                    : "Select a collection"}
                </CardTitle>
                {selectedCollection && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchPoints()}
                    >
                      <HiOutlineRefresh className="size-3" /> Refresh
                    </Button>
                    <Dialog>
                      <DialogTrigger render={
                        <Button variant="destructive" size="sm">
                          <HiOutlineTrash className="size-3" /> Delete
                        </Button>
                      } />
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Collection</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{selectedCollection}</strong>? This action
                            cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteCollection}
                            disabled={deleteCollection.isPending}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCollection ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <HiOutlineDatabase className="size-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Select a collection from the sidebar to view its points
                  </p>
                </div>
              ) : pointsLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading points...
                </div>
              ) : pointsError ? (
                <div className="py-8 text-center text-sm text-destructive">
                  Failed to load points
                </div>
              ) : !pointsData || pointsData.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No points in this collection
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Payload</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointsData.map((point) => (
                          <TableRow key={point.id}>
                            <TableCell className="font-mono text-xs">
                              {point.id}
                            </TableCell>
                            <TableCell>
                              <ScrollArea className="h-[80px] w-full">
                                <pre className="text-xs whitespace-pre-wrap break-all">
                                  {truncateText(
                                    JSON.stringify(point.payload, null, 2),
                                    500
                                  )}
                                </pre>
                              </ScrollArea>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Dialog>
                                  <DialogTrigger render={
                                    <Button variant="ghost" size="icon-xs">
                                      <HiOutlineEye className="size-3.5" />
                                    </Button>
                                  } />
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Point #{point.id}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Full payload data
                                      </DialogDescription>
                                    </DialogHeader>
                                    <pre className="text-xs whitespace-pre-wrap break-all bg-muted/50 p-4 rounded-lg">
                                      {JSON.stringify(
                                        point.payload,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </DialogContent>
                                </Dialog>
                                <Dialog>
                                  <DialogTrigger render={
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      className="text-destructive"
                                    >
                                      <HiOutlineTrash className="size-3.5" />
                                    </Button>
                                  } />
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete Point</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete point{" "}
                                        <strong>#{point.id}</strong> from{" "}
                                        <strong>
                                          {selectedCollection}
                                        </strong>
                                        ?
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => setDeleteConfirm(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          setDeleteConfirm({
                                            type: "point",
                                            name: selectedCollection,
                                            id: point.id,
                                          });
                                        }}
                                        disabled={deletePoint.isPending}
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {pointsData.length >= pointLimit && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pointOffset === 0}
                        onClick={() => setPointOffset((p) => Math.max(0, p - pointLimit))}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Showing {pointOffset + 1}–{pointOffset + pointsData.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPointOffset((p) => p + pointLimit)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialogs */}
      {deleteConfirm?.type === "collection" && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Collection</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCollection}
                disabled={deleteCollection.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deleteConfirm?.type === "point" && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Point</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete point <strong>#{deleteConfirm.id}</strong>{" "}
                from <strong>{deleteConfirm.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePoint}
                disabled={deletePoint.isPending}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}