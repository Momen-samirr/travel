"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";

interface BlogCardProps {
  blog: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    category: string | null;
    publishedAt: Date | null;
    author: {
      name: string | null;
    } | null;
  };
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="card-hover overflow-hidden group h-full">
          {blog.featuredImage && (
            <div className="relative h-64 w-full overflow-hidden">
              <Image
                src={blog.featuredImage}
                alt={blog.title}
                fill
                className="object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              {blog.category && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                  {blog.category}
                </Badge>
              )}
            </div>
          )}
          <CardHeader>
            <CardTitle className="line-clamp-2 text-xl">{blog.title}</CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {blog.publishedAt ? formatDate(blog.publishedAt) : "Draft"}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {blog.author?.name || "Admin"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blog.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.75rem]">
                {blog.excerpt}
              </p>
            )}
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={`/blogs/${blog.slug}`}>Read More</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

