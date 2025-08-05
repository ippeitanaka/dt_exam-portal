import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // get_test_rankings関数を作成
    const { error: error1 } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_test_rankings(
          p_test_name TEXT,
          p_test_date DATE
        )
        RETURNS TABLE (
          id UUID,
          student_id TEXT,
          name TEXT,
          test_name TEXT,
          test_date DATE,
          section_a INTEGER,
          section_b INTEGER,
          section_c INTEGER,
          section_d INTEGER,
          section_ad INTEGER,
          section_bc INTEGER,
          total_score INTEGER,
          created_at TIMESTAMPTZ,
          rank INTEGER
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            ts.id,
            ts.student_id,
            ts.name,
            ts.test_name,
            ts.test_date,
            ts.section_a,
            ts.section_b,
            ts.section_c,
            ts.section_d,
            ts.section_ad,
            ts.section_bc,
            ts.total_score,
            ts.created_at,
            RANK() OVER (ORDER BY ts.total_score DESC)::INTEGER as rank
          FROM test_scores ts
          WHERE ts.test_name = p_test_name 
            AND ts.test_date = p_test_date
          ORDER BY ts.total_score DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (error1) {
      console.error('Error creating get_test_rankings:', error1)
    }

    // get_total_rankings関数を作成
    const { error: error2 } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION get_total_rankings()
        RETURNS TABLE (
          student_id TEXT,
          name TEXT,
          avg_total_score NUMERIC,
          test_count INTEGER,
          rank INTEGER,
          avg_rank NUMERIC
        ) AS $$
        BEGIN
          RETURN QUERY
          WITH student_averages AS (
            SELECT 
              ts.student_id,
              ts.name,
              AVG(ts.total_score) as avg_total_score,
              COUNT(*) as test_count
            FROM test_scores ts
            GROUP BY ts.student_id, ts.name
            HAVING COUNT(*) > 0
          ),
          student_avg_ranks AS (
            SELECT 
              sa.student_id,
              sa.name,
              sa.avg_total_score,
              sa.test_count,
              RANK() OVER (ORDER BY sa.avg_total_score DESC)::INTEGER as rank,
              sa.avg_total_score as avg_rank
            FROM student_averages sa
          )
          SELECT * FROM student_avg_ranks
          ORDER BY rank;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })

    if (error2) {
      console.error('Error creating get_total_rankings:', error2)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ranking functions created successfully',
      errors: [error1, error2].filter(Boolean)
    })

  } catch (error) {
    console.error('Error creating ranking functions:', error)
    return NextResponse.json(
      { success: false, error: error },
      { status: 500 }
    )
  }
}
