import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import axios from "axios";

export function Home() {
  const [youtubeLink, setYoutubeLink] = useState("");
  const [compiledContent, setCompiledContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // API call to backend
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/generate-blog`,
        { link: youtubeLink },
        {
          headers: {
            authorization: `Token ${localStorage.getItem("token")}`,
          },
        }
      );
      const compiled = response.data.generated_content;
      setCompiledContent(compiled);
    } catch (error) {
      console.error("Error generating blog:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/blog-list`, {
        headers: {
          authorization: `Token ${localStorage.getItem("token")}`,
        },
      })
      .then((response) =>
        localStorage.setItem(
          "savedBlogs",
          JSON.stringify(response.data.blogs || [])
        )
      )
      .catch((error) => console.log(error));
  }, []);

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Convert YouTube to Blog</h1>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            <div>
              <Label htmlFor="youtube-link">YouTube Video Link</Label>
              <Input
                id="youtube-link"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Blog...
                </>
              ) : (
                "Generate Blog"
              )}
            </Button>
          </form>
        </div>
        {isLoading && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Compiling blog content...</p>
          </div>
        )}
        {compiledContent && !isLoading && (
          <div className="space-y-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold self-start">
              Generated Blog Content
            </h2>
            <ScrollArea className="h-[calc(100vh-300px)] w-full rounded-md border p-4 bg-muted">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: compiledContent
                    .replace(/^```html/, "<html>")
                    .replace(/```/, "")
                    .replace(/\\n/g, "")
                    .replace(/\\t/g, "")
                    .replace(/\\"/g, '"'),
                }}
              />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
