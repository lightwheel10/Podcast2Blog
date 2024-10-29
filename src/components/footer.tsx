import { Button } from "@/src/ui/button"
import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container flex flex-col gap-6 py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 12L10.5 14V10L14 12Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12.7075V11.2924C2 8.39705 2 6.94939 2.90549 6.01792C3.81099 5.08645 5.23656 5.04613 8.08769 4.96549C9.43873 4.92728 10.8188 4.8999 12 4.8999C13.1812 4.8999 14.5613 4.92728 15.9123 4.96549C18.7634 5.04613 20.189 5.08645 21.0945 6.01792C22 6.94939 22 8.39705 22 11.2924V12.7075C22 15.6028 22 17.0505 21.0945 17.982C20.189 18.9134 18.7635 18.9538 15.9124 19.0344C14.5613 19.0726 13.1812 19.1 12 19.1C10.8188 19.1 9.43867 19.0726 8.0876 19.0344C5.23651 18.9538 3.81097 18.9134 2.90548 17.982C2 17.0505 2 15.6028 2 12.7075Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="text-lg font-bold">YT2Blog</span>
          </div>
          <div className="flex items-center gap-6">
            <ul className="flex gap-4 text-sm text-muted-foreground">
              <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <GitHubLogoIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <TwitterLogoIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center md:text-left">
          © 2024 YT2Blog. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 