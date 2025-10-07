"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Eye, Trash2, FileText, ImageIcon, FileArchive, File } from "lucide-react"
import { DataTable } from "@/components/common/data-table"
import { ActionButtons } from "@/components/common/action-buttons"

const mockFiles = [
  {
    id: "1",
    name: "Project_Proposal.pdf",
    type: "document",
    size: "2.4 MB",
    uploadedBy: "John Doe",
    uploadedDate: "2025-10-05",
    category: "Projects",
  },
  {
    id: "2",
    name: "Employee_Contract.docx",
    type: "document",
    size: "156 KB",
    uploadedBy: "Sarah Chen",
    uploadedDate: "2025-10-04",
    category: "HR",
  },
  {
    id: "3",
    name: "Logo_Design.png",
    type: "image",
    size: "845 KB",
    uploadedBy: "Mike Chen",
    uploadedDate: "2025-10-03",
    category: "Design",
  },
  {
    id: "4",
    name: "Invoice_2025_001.pdf",
    type: "document",
    size: "324 KB",
    uploadedBy: "Emily Davis",
    uploadedDate: "2025-10-02",
    category: "Finance",
  },
  {
    id: "5",
    name: "Meeting_Notes.txt",
    type: "document",
    size: "12 KB",
    uploadedBy: "John Doe",
    uploadedDate: "2025-10-01",
    category: "General",
  },
]

export function FileList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredFiles = mockFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || file.type === activeTab

    return matchesSearch && matchesTab
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "image":
        return <ImageIcon className="h-4 w-4 text-purple-600" />
      case "archive":
        return <FileArchive className="h-4 w-4 text-orange-600" />
      default:
        return <File className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Files</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="document">Documents</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="archive">Archives</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <DataTable<typeof filteredFiles[0]>
              columns={[
                { key: 'name', header: 'Name', sortable: true, cell: (f:any) => (
                  <div className="flex items-center gap-2">{getFileIcon(f.type)}<span className="font-medium">{f.name}</span></div>
                )},
                { key: 'category', header: 'Category', sortable: true, cell: (f:any) => <Badge variant="outline">{f.category}</Badge> },
                { key: 'size', header: 'Size' },
                { key: 'uploadedBy', header: 'Uploaded By', sortable: true },
                { key: 'uploadedDate', header: 'Date', sortable: true, sortAccessor: (f:any)=> new Date(f.uploadedDate).getTime(), cell: (f:any) => new Date(f.uploadedDate).toLocaleDateString() },
                { key: 'actions', header: <span className="block text-center">Actions</span>, cell: (file:any) => (
                  <div className="flex items-center justify-center">
                    <ActionButtons
                      extras={[
                        { title: 'Preview', onClick: () => {}, icon: <Eye className="h-4 w-4" /> },
                        { title: 'Download', onClick: () => {}, icon: <Download className="h-4 w-4" /> },
                        { title: 'Delete', onClick: () => {}, className: 'hover:bg-red-100', icon: <Trash2 className="h-4 w-4 text-red-600" /> },
                      ]}
                    />
                  </div>
                )},
              ]}
              data={filteredFiles as any}
              getRowKey={(f:any)=>f.id}
              striped
              pageSize={10}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
