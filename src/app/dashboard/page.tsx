"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, MapPin, ExternalLink, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Pie, PieChart, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ModeToggle } from "@/components/toggle_theme";

interface GitHubData {
  login: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string;
  location: string;
  created_at: string;
  repos_url: string;
}

interface RepoData {
  id: number;
  name: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  homepage: string | null;
  updated_at: string;
}

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<GitHubData | null>(null);
  const [repos, setRepos] = useState<RepoData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [reposPerPage] = useState(10); // Number of repos per page
  const [aiSummary, setAiSummary] = useState("");

  const fetchGitHubData = async () => {
    if (!username) return;

    setError("");
    setData(null);
    setRepos([]);
    setAiSummary("");

    try {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) throw new Error("User not found");
      const userData = await res.json();

      const reposRes = await fetch(userData.repos_url);
      if (!reposRes.ok) throw new Error("Repositories not found");
      const reposData = await reposRes.json();

      // Sort repos by updated_at in descending order
      const sortedRepos = reposData.sort(
        (a: RepoData, b: RepoData) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setData(userData);
      setRepos(sortedRepos);

      // Generate AI summary
      generateAiSummary(userData, sortedRepos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI summary
  const generateAiSummary = async (userData: GitHubData, repos: RepoData[]) => {
    const summary = `This GitHub profile belongs to ${userData.name || userData.login}, who joined GitHub in ${new Date(
      userData.created_at
    ).getFullYear()}. They have ${userData.public_repos} public repositories, ${userData.followers} followers, and are following ${userData.following} users. Their most popular repository is "${
      repos[0]?.name
    }" with ${repos[0]?.stargazers_count} stars.`;

    setAiSummary(summary);
  };

  // Donut Chart Data - Language Usage
  const languageUsage = repos.reduce((acc: Record<string, number>, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {});

  const donutChartData = Object.keys(languageUsage).map((key) => ({
    language: key,
    count: languageUsage[key],
    fill: `hsl(0, 0%, ${Math.floor(Math.random() * 50) + 10}%)`, // Shades of black
  }));

  const totalLanguages = donutChartData.reduce((acc, curr) => acc + curr.count, 0);

  // Bar Chart Data - Stars & Forks
  const barChartData = repos.map((repo) => ({
    name: repo.name,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
  }));

  // Pagination Logic
  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = repos.slice(indexOfFirstRepo, indexOfLastRepo);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Bar Chart Config
  const barChartConfig = {
    stars: {
      label: "Stars",
      color: "hsl(var(--chart-1))",
    },
    forks: {
      label: "Forks",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col items-center p-6 w-full min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Search Bar */}
      <div className="flex gap-2 w-full max-w-6xl mb-6">
        <Input
          type="text"
          placeholder="Enter GitHub Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-white dark:bg-black text-black dark:text-white"
        />
        <Button
          onClick={fetchGitHubData}
          className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Search />
        </Button>
        <ModeToggle />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Profile Card */}
      {loading ? (
        <Card className="mb-6 flex flex-col md:flex-row items-center p-6 w-full max-w-6xl bg-white dark:bg-black">
          <Skeleton className="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-6 bg-gray-200 dark:bg-black" />
          <div className="flex flex-col text-center md:text-left w-full">
            <Skeleton className="h-8 w-48 mb-2 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-4 w-32 mb-2 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-4 w-64 mb-2 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-4 w-48 mb-2 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-10 w-24 mt-4 bg-gray-200 dark:bg-gray-800" />
          </div>
        </Card>
      ) : (
        data && (
          <div className="w-full max-w-6xl">
            <Card className="mb-6 flex flex-col md:flex-row items-center p-6 bg-white dark:bg-black">
              <img src={data.avatar_url} alt="Profile" className="w-24 h-24 rounded-full mb-4 md:mb-0 md:mr-6" />
              <div className="flex flex-col text-center md:text-left">
                <h2 className="text-2xl font-bold text-black dark:text-white">{data.name || data.login}</h2>
                <p className="text-gray-500 dark:text-gray-400">@{data.login}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{data.bio || "No bio available"}</p>
                <div className="flex gap-2 mt-2 justify-center md:justify-start">
                  {data.location && (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <MapPin size={16} /> {data.location}
                    </span>
                  )}
                  <a href={data.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 flex items-center gap-1">
                    GitHub <ExternalLink size={16} />
                  </a>
                </div>
                <Button
                  className="mt-4 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  onClick={() => window.open(data.html_url, "_blank")}
                >
                  Follow
                </Button>
              </div>
            </Card>

            {/* User Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="bg-white dark:bg-black">
                  <CardContent className="p-4 text-center">
                    {loading ? (
                      <>
                        <Skeleton className="h-8 w-16 mx-auto mb-2 bg-gray-200 dark:bg-gray-800" />
                        <Skeleton className="h-4 w-24 mx-auto bg-gray-200 dark:bg-gray-800" />
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-black dark:text-white">
                          {index === 0
                            ? data.public_repos
                            : index === 1
                            ? data.followers
                            : index === 2
                            ? data.following
                            : new Date(data.created_at).getFullYear()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {index === 0
                            ? "Public Repos"
                            : index === 1
                            ? "Followers"
                            : index === 2
                            ? "Following"
                            : "Joined"}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Donut Chart - Language Usage */}
              <Card className="w-full md:w-1/2 p-4 bg-white dark:bg-black">
                <CardHeader className="items-center pb-0">
                  <CardTitle className="text-black dark:text-white">Languages Used</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">GitHub Repositories</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={{
                      language: { label: "Language" },
                      count: { label: "Repositories" },
                    }}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={donutChartData}
                        dataKey="count"
                        nameKey="language"
                        innerRadius={60}
                        outerRadius={80}
                        strokeWidth={5}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    {totalLanguages}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    Repos
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Bar Chart - Stars & Forks */}
              <Card className="w-full md:w-1/2 p-4 bg-white dark:bg-zinc-900">
                <CardHeader>
                  <CardTitle className="text-black dark:text-white">Stars & Forks</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">GitHub Repositories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={barChartConfig}>
                    <BarChart data={barChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)} // Shorten repo names
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dashed" />}
                      />
                      <Bar dataKey="stars" fill="var(--color-stars)" radius={4} />
                      <Bar dataKey="forks" fill="var(--color-forks)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 font-medium leading-none text-black dark:text-white">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="leading-none text-muted-foreground">
                    Showing stars and forks for the last 6 months
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Repos Table */}
            <div className="mb-6 mt-4">
              <h2 className="text-lg font-semibold mb-2 text-black dark:text-white">Public Repositories</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black dark:text-white">Repo Name</TableHead>
                    <TableHead className="text-black dark:text-white">Stars</TableHead>
                    <TableHead className="text-black dark:text-white">Forks</TableHead>
                    <TableHead className="text-black dark:text-white">Language</TableHead>
                    <TableHead className="text-black dark:text-white">Homepage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-gray-800" />
                          </TableCell>
                        </TableRow>
                      ))
                    : currentRepos.map((repo) => (
                        <TableRow key={repo.id}>
                          <TableCell className="text-black dark:text-white">{repo.name}</TableCell>
                          <TableCell className="text-black dark:text-white">{repo.stargazers_count}</TableCell>
                          <TableCell className="text-black dark:text-white">{repo.forks_count}</TableCell>
                          <TableCell className="text-black dark:text-white">{repo.language || "N/A"}</TableCell>
                          <TableCell className="text-black dark:text-white">
                            {repo.homepage ? (
                              <a href={repo.homepage} target="_blank" className="text-blue-500">
                                Visit
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-center mt-4">
                {Array.from({ length: Math.ceil(repos.length / reposPerPage) }).map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    className="mx-1 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Summary Card */}
            <Card className="w-full mt-6 bg-white dark:bg-black">
              <CardHeader>
                <CardTitle className="text-black dark:text-white">AI Summary</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Automated insights about this GitHub profile</CardDescription>
              </CardHeader>
              <CardContent>
                {aiSummary ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">{aiSummary}</p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No summary available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
}