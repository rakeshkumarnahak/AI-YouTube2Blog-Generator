import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SavedBlog {
  id: number;
  user: number;
  youtube_link: string;
  youtube_title: string;
  youtube_description: string;
  generated_content: string;
  created_at: string;
}

export default function SavedBlogs() {
  const [savedBlogs, setSavedBlogs] = useState<SavedBlog[]>([]);

  useEffect(() => {
    const blogs = JSON.parse(localStorage.getItem("savedBlogs") || "[]");
    setSavedBlogs(blogs);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Saved Blogs</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {savedBlogs.length > 0 ? (
          savedBlogs.map((blog) => (
            <DropdownMenuItem key={blog.id}>
              <Link to={`/blog/${blog.id}`} className="w-full">
                {`${blog.youtube_title.substring(0, 25)}...`}
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No saved blogs</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
