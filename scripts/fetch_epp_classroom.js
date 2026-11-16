const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

async function getValidAccessToken(user) {
  if (!user.refreshToken) return user.accessToken;

  // Try refreshing the token
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type: 'refresh_token'
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (res.ok) {
      const tokenData = await res.json();
      console.log('✓ Successfully refreshed Google OAuth token for', user.email);
      await prisma.user.update({
        where: { id: user.id },
        data: { accessToken: tokenData.access_token }
      });
      return tokenData.access_token;
    } else {
      console.warn('Token refresh response not ok:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('Token refresh error:', err.message);
  }

  return user.accessToken;
}

async function fetchCourseData(courseId, token) {
  const results = { courseWork: [], materials: [], announcements: [] };
  
  // 1. Fetch CourseWork (Assignments & Questions)
  try {
    const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (cwRes.ok) {
      const data = await cwRes.json();
      results.courseWork = data.courseWork || [];
      console.log(`✓ Fetched ${results.courseWork.length} CourseWork items from course ${courseId}`);
    } else {
      console.log(`- CourseWork fetch: HTTP ${cwRes.status}`);
    }
  } catch (e) {
    console.warn('CourseWork fetch error:', e.message);
  }

  // 2. Fetch CourseWork Materials
  try {
    const matRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (matRes.ok) {
      const data = await matRes.json();
      results.materials = data.courseWorkMaterial || [];
      console.log(`✓ Fetched ${results.materials.length} CourseWork Materials from course ${courseId}`);
    } else {
      console.log(`- CourseWork Materials fetch: HTTP ${matRes.status}`);
    }
  } catch (e) {
    console.warn('Materials fetch error:', e.message);
  }

  // 3. Fetch Announcements
  try {
    const annRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (annRes.ok) {
      const data = await annRes.json();
      results.announcements = data.announcements || [];
      console.log(`✓ Fetched ${results.announcements.length} Announcements from course ${courseId}`);
    }
  } catch (e) {
    console.warn('Announcements fetch error:', e.message);
  }

  return results;
}

async function main() {
  console.log('🔍 Checking Google Classroom for EPP Courses...');
  const users = await prisma.user.findMany({
    where: {
      classroomMappings: {
        some: { subjectCode: 'EX40003' }
      }
    },
    include: { classroomMappings: true }
  });

  console.log(`Found ${users.length} users with EX40003 classroom mappings.`);

  for (const user of users) {
    console.log(`\nUser: ${user.name} (${user.email})`);
    const validToken = await getValidAccessToken(user);
    if (!validToken) {
      console.log('No access token available for this user.');
      continue;
    }

    const eppMappings = user.classroomMappings.filter(m => m.subjectCode === 'EX40003');
    for (const mapping of eppMappings) {
      console.log(`\nFetching for Course: ${mapping.courseName} (ID: ${mapping.courseId})...`);
      const data = await fetchCourseData(mapping.courseId, validToken);
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
