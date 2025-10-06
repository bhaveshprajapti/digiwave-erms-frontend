import { FileList } from "@/components/files/file-list"
import { FileStats } from "@/components/files/file-stats"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Files</h2>
          <p className="text-muted-foreground">Manage documents and files</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>
      <FileStats />
      <FileList />
    </div>
  )
}
