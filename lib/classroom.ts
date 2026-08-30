import { db } from './prisma';

const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

// Filters and algorithmic scoring have been removed as per user request to allow manual control.
// --- API FUNCTIONS ---

export async function getValidToken(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accessToken: true, refreshToken: true, tokenExpiry: true }
  });

  if (!user || !user.accessToken) {
    throw new Error('User not authenticated with Google or tokens missing');
  }

  // Check if token is expired (with 1 minute buffer)
  if (user.tokenExpiry && new Date(user.tokenExpiry).getTime() - 60000 < Date.now()) {
    if (!user.refreshToken) {
      throw new Error('Access token expired and no refresh token available');
    }

    // Refresh the token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to refresh Google token:', data);
      throw new Error('Failed to refresh Google token');
    }

    const newExpiry = new Date(Date.now() + data.expires_in * 1000);

    await db.user.update({
      where: { id: userId },
      data: {
        accessToken: data.access_token,
        tokenExpiry: newExpiry,
      },
    });

    return data.access_token;
  }

  return user.accessToken;
}

export async function fetchUserCourses(accessToken: string) {
  const response = await fetch(`${CLASSROOM_API_BASE}/courses?courseStates=ACTIVE`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching courses:', error);
    throw new Error('Failed to fetch courses from Google Classroom');
  }

  const data = await response.json();
  return data.courses || [];
}

export async function fetchCourseWork(accessToken: string, courseId: string) {
  const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`Error fetching coursework for course ${courseId}:`, error);
    return []; // Return empty if failed for one course
  }

  const data = await response.json();
  return data.courseWork || [];
}

export async function getClassroomData(userId: string) {
  const token = await getValidToken(userId);
  
  // Fetch hidden courses from the database
  let hiddenCourseIds: string[] = [];
  try {
    const hiddenRecords = await db.hiddenCourse.findMany({
      where: { userId },
      select: { courseId: true }
    });
    hiddenCourseIds = hiddenRecords.map((r: { courseId: string }) => r.courseId);
  } catch (err) {
    console.warn("Failed to fetch hidden courses:", err);
  }

  const courses = await fetchUserCourses(token);
  
  const coursesWithWork = await Promise.all(
    courses.map(async (course: any) => {
      const assignments = await fetchCourseWork(token, course.id);
      return {
        ...course,
        assignments
      };
    })
  );

  return { 
    courses: coursesWithWork,
    hiddenCourseIds 
  };
}

