import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { ref, nextTick } from "vue"
import { useDebounce } from "~~/app/composables/useDebounce"

describe( "app/composables/useDebounce", () => {
  beforeEach( () => {
    vi.useFakeTimers()
  } )

  afterEach( () => {
    vi.useRealTimers()
  } )

  it( "should return initial value immediately", () => {
    const source = ref( "hello" )
    const debounced = useDebounce( source, 300 )

    expect( debounced.value ).toBe( "hello" )
  } )

  it( "should debounce value updates", async () => {
    const source = ref( "initial" )
    const debounced = useDebounce( source, 300 )

    source.value = "updated"
    await nextTick()
    expect( debounced.value ).toBe( "initial" )

    vi.advanceTimersByTime( 299 )
    await nextTick()
    expect( debounced.value ).toBe( "initial" )

    vi.advanceTimersByTime( 1 )
    await nextTick()
    expect( debounced.value ).toBe( "updated" )
  } )

  it( "should cancel pending updates on rapid changes", async () => {
    const source = ref( "a" )
    const debounced = useDebounce( source, 300 )

    source.value = "b"
    await nextTick()
    vi.advanceTimersByTime( 100 )

    source.value = "c"
    await nextTick()
    vi.advanceTimersByTime( 100 )

    source.value = "d"
    await nextTick()
    vi.advanceTimersByTime( 100 )

    // Still showing initial since no 300ms has passed without change
    expect( debounced.value ).toBe( "a" )

    vi.advanceTimersByTime( 200 )
    await nextTick()
    // Now 300ms after last change ("d")
    expect( debounced.value ).toBe( "d" )
  } )

  it( "should use default delay of 300ms if not specified", async () => {
    const source = ref( "test" )
    const debounced = useDebounce( source )

    source.value = "changed"
    await nextTick()
    vi.advanceTimersByTime( 299 )
    await nextTick()
    expect( debounced.value ).toBe( "test" )

    vi.advanceTimersByTime( 1 )
    await nextTick()
    expect( debounced.value ).toBe( "changed" )
  } )

  it( "should work with number values", async () => {
    const source = ref( 0 )
    const debounced = useDebounce( source, 100 )

    source.value = 42
    await nextTick()
    vi.advanceTimersByTime( 100 )
    await nextTick()

    expect( debounced.value ).toBe( 42 )
  } )

  it( "should work with object values", async () => {
    const source = ref( { name: "old" } )
    const debounced = useDebounce( source, 100 )

    source.value = { name: "new" }
    await nextTick()
    vi.advanceTimersByTime( 100 )
    await nextTick()

    expect( debounced.value ).toEqual( { name: "new" } )
  } )
} )
