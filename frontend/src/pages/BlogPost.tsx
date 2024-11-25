import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import axios from "axios";
import html2pdf from "html2pdf.js";

interface SavedBlog {
  id: number;
  user: number;
  youtube_link: string;
  youtube_title: string;
  youtube_description: string;
  generated_content: string;
  created_at: string;
}

export function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [blogContent, setBlogContent] = useState<SavedBlog | null>(null);
  const [generatedContent, setGeneratedContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);

      axios
        .get(`http://127.0.0.1:8000/blog-detail/${id}`, {
          headers: {
            authorization: `Token ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
          // console.log(response.data.blog);
          setBlogContent(response.data.blog);
          setGeneratedContent(response.data.blog?.generated_content);
        })
        .catch((error) => console.log(error));
      setIsLoading(false);
    }
  }, [id]);

  // Filtered HTML content
  const finalBlogContent = generatedContent
    ?.replace(/^```html/, "<html>")
    ?.replace(/```/, "")
    ?.replace(/\\n/g, "")
    ?.replace(/\\t/g, "")
    ?.replace(/\\"/g, '"');

  // const handleDownloadPDF = () => {
  //   // In a real application, you would make an API call to generate and download the PDF
  //   // For this example, we'll just simulate a download
  //   const blob = new Blob([finalBlogContent], { type: "application/html" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `blog-${id}.tex`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  const handleDownloadPDF = () => {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = finalBlogContent;

    document.body.appendChild(tempElement);

    // Apply styles dynamically to elements
    // const bodyElements = tempElement.getElementsByTagName("body");
    // for (const bodyElement of bodyElements) {
    //   bodyElement.style.paddingTop = "15mm";
    //   bodyElement.style.paddingRight = "10mm";
    //   bodyElement.style.paddingBottom = "13mm";
    //   bodyElement.style.paddingLeft = "10mm";
    // }

    const h1Elements = tempElement.getElementsByTagName("h1");
    for (const h1 of h1Elements) {
      h1.style.fontWeight = "800";
      h1.style.marginBottom = "10px";
    }

    const h2Elements = tempElement.getElementsByTagName("h2");
    for (const h2 of h2Elements) {
      h2.style.fontWeight = "600";
      h2.style.marginBottom = "10px";
    }

    tempElement.style.padding = "20mm";

    // Options for html2pdf
    const options = {
      filename: `${blogContent?.youtube_title}.pdf`, // File name
      html2canvas: { scale: 5, dpi: 300 }, // Scale for the canvas rendering
      jsPDF: {
        unit: "mm", // Measurement unit in millimeters
        format: "a4", // Set format to A4
        orientation: "portrait", // Set orientation to portrait
        margins: { top: 20, left: 20, bottom: 20, right: 20 }, // Set margins
        autoPaging: true, // Enable auto page break
        // Optional: define the page size for better control
        pageSize: "A4",
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      jsPDFInstance: function (pdf: any) {
        // Customize the jsPDF instance if needed
        pdf.setFont("helvetica"); // Choose font
        pdf.setFontSize(12); // Set font size
      },
    };

    html2pdf().from(tempElement).set(options).save();

    document.body.removeChild(tempElement);
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold self-start">
          {`${blogContent?.youtube_title.substring(0, 120)}...`}
        </h1>
        {isLoading ? (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Loading blog content...</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)] w-full rounded-md border p-4 bg-muted">
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: finalBlogContent }}
            />
          </ScrollArea>
        )}
        <Button onClick={handleDownloadPDF} className="self-end">
          Download PDF
        </Button>
      </div>
    </div>
  );
}
