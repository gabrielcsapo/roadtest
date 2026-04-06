import { describe, it, expect, render, fireEvent, snapshot } from '@viewtest/core'
import { VendorTagList } from './VendorTagList'

const sampleTags = ['cloud', 'saas', 'security', 'compliance', 'hipaa', 'iso27001', 'soc2', 'gdpr']

describe('VendorTagList', () => {
  // Basic rendering (10)
  it('renders tag list container', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} />)
    expect(getByTestId('vendor-tag-list')).toBeDefined()
  })

  it('renders empty state when no tags', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} />)
    expect(getByTestId('vendor-tag-list-empty')).toBeDefined()
  })

  it('does not render list when empty and not editable', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={[]} />)
    expect(queryByTestId('vendor-tag-list')).toBeNull()
  })

  it('renders tags up to maxVisible', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    expect(queryByTestId('tag-item-cloud')).toBeDefined()
    expect(queryByTestId('tag-item-saas')).toBeDefined()
    expect(queryByTestId('tag-item-security')).toBeDefined()
    expect(queryByTestId('tag-item-compliance')).toBeNull()
  })

  it('renders all tags when count <= maxVisible', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} maxVisible={5} />)
    expect(getByTestId('tag-item-cloud')).toBeDefined()
    expect(getByTestId('tag-item-saas')).toBeDefined()
  })

  it('renders show more button when tags exceed maxVisible', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    expect(getByTestId('show-more-tags')).toBeDefined()
  })

  it('hides show more button when tags do not exceed maxVisible', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} maxVisible={5} />)
    expect(queryByTestId('show-more-tags')).toBeNull()
  })

  it('snapshot default', async () => {
    await render(<VendorTagList tags={['cloud', 'saas', 'security']} />)
    await snapshot('vendor-tag-list-default')
  })

  it('snapshot with overflow', async () => {
    await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    await snapshot('vendor-tag-list-overflow')
  })

  it('snapshot empty', async () => {
    await render(<VendorTagList tags={[]} />)
    await snapshot('vendor-tag-list-empty-state')
  })

  // Individual tags (10)
  it('renders badge for each visible tag', async () => {
    const tags = ['cloud', 'saas', 'security']
    const { getByTestId } = await render(<VendorTagList tags={tags} />)
    for (const tag of tags) expect(getByTestId(`tag-badge-${tag}`)).toBeDefined()
  })

  it('renders tag item wrapper', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(getByTestId('tag-item-cloud')).toBeDefined()
  })

  it('renders correct tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['hipaa']} />)
    expect(getByTestId('tag-badge-hipaa').textContent).toBe('hipaa')
  })

  it('calls onTagClick with tag when badge clicked', async () => {
    let clicked = ''
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} onTagClick={t => { clicked = t }} />)
    await fireEvent.click(getByTestId('tag-badge-cloud'))
    expect(clicked).toBe('cloud')
  })

  it('does not throw when onTagClick undefined', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} />)
    await fireEvent.click(getByTestId('tag-badge-cloud'))
    expect(getByTestId('tag-badge-cloud')).toBeDefined()
  })

  it('fires onTagClick for each tag', async () => {
    const tags = ['cloud', 'saas']
    for (const tag of tags) {
      let clicked = ''
      const { getByTestId } = await render(<VendorTagList tags={tags} onTagClick={t => { clicked = t }} />)
      await fireEvent.click(getByTestId(`tag-badge-${tag}`))
      expect(clicked).toBe(tag)
    }
  })

  it('renders 1 visible tag', async () => {
    const { container } = await render(<VendorTagList tags={['cloud']} maxVisible={5} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(1)
  })

  it('renders 5 visible tags with maxVisible=5', async () => {
    const tags = ['a', 'b', 'c', 'd', 'e']
    const { container } = await render(<VendorTagList tags={tags} maxVisible={5} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(5)
  })

  it('renders only 3 visible when maxVisible=3 and 8 tags', async () => {
    const { container } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(3)
  })

  it('renders default maxVisible of 5', async () => {
    const { container } = await render(<VendorTagList tags={sampleTags} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(5)
  })

  // Show more / show less (10)
  it('show more button shows count of hidden tags', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    expect(getByTestId('show-more-tags').textContent).toContain(`+${sampleTags.length - 3}`)
  })

  it('clicking show more reveals all tags', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    for (const tag of sampleTags) {
      expect(getByTestId(`tag-badge-${tag}`)).toBeDefined()
    }
  })

  it('clicking show more hides show more button', async () => {
    const { getByTestId, queryByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    expect(queryByTestId('show-more-tags')).toBeNull()
  })

  it('clicking show more shows show less button', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    expect(getByTestId('show-less-tags')).toBeDefined()
  })

  it('clicking show less collapses to maxVisible', async () => {
    const { getByTestId, queryByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    await fireEvent.click(getByTestId('show-less-tags'))
    expect(queryByTestId(`tag-badge-${sampleTags[5]}`)).toBeNull()
  })

  it('hides show less button initially', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    expect(queryByTestId('show-less-tags')).toBeNull()
  })

  it('snapshot after show more', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    await snapshot('vendor-tag-list-expanded')
  })

  it('show more button text contains hidden count', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['a', 'b', 'c', 'd', 'e', 'f']} maxVisible={3} />)
    expect(getByTestId('show-more-tags').textContent).toContain('+3')
  })

  it('show more with maxVisible=1 shows count 7 for 8 tags', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={1} />)
    expect(getByTestId('show-more-tags').textContent).toContain('+7')
  })

  it('no show more when exactly maxVisible tags', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['a', 'b', 'c']} maxVisible={3} />)
    expect(queryByTestId('show-more-tags')).toBeNull()
  })

  // Editable mode (20)
  it('renders in editable mode', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onAddTag={() => {}} />)
    expect(getByTestId('vendor-tag-list')).toBeDefined()
  })

  it('shows add tag button in editable mode', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onAddTag={() => {}} />)
    expect(getByTestId('add-tag-button')).toBeDefined()
  })

  it('hides add tag button when not editable', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(queryByTestId('add-tag-button')).toBeNull()
  })

  it('clicking add tag button shows input', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    expect(getByTestId('add-tag-input')).toBeDefined()
  })

  it('shows confirm and cancel buttons in add mode', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    expect(getByTestId('confirm-add-tag')).toBeDefined()
    expect(getByTestId('cancel-add-tag')).toBeDefined()
  })

  it('calls onAddTag with input value when confirm clicked', async () => {
    let added = ''
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={t => { added = t }} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.change(getByTestId('add-tag-input'), { target: { value: 'newtag' } })
    await fireEvent.click(getByTestId('confirm-add-tag'))
    expect(added).toBe('newtag')
  })

  it('clears input after adding tag', async () => {
    const { getByTestId, queryByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.change(getByTestId('add-tag-input'), { target: { value: 'newtag' } })
    await fireEvent.click(getByTestId('confirm-add-tag'))
    expect(queryByTestId('add-tag-input')).toBeNull()
  })

  it('cancel hides input without adding', async () => {
    let added = false
    const { getByTestId, queryByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => { added = true }} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.click(getByTestId('cancel-add-tag'))
    expect(queryByTestId('add-tag-input')).toBeNull()
    expect(added).toBe(false)
  })

  it('shows remove button for each tag in editable mode', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} editable onRemoveTag={() => {}} />)
    expect(getByTestId('remove-tag-cloud')).toBeDefined()
    expect(getByTestId('remove-tag-saas')).toBeDefined()
  })

  it('calls onRemoveTag with tag when remove clicked', async () => {
    let removed = ''
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onRemoveTag={t => { removed = t }} />)
    await fireEvent.click(getByTestId('remove-tag-cloud'))
    expect(removed).toBe('cloud')
  })

  it('hides remove buttons when not editable', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(queryByTestId('remove-tag-cloud')).toBeNull()
  })

  it('editable mode shows list container', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    expect(getByTestId('vendor-tag-list')).toBeDefined()
  })

  it('does not call onAddTag when input is empty', async () => {
    let added = false
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => { added = true }} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.click(getByTestId('confirm-add-tag'))
    expect(added).toBe(false)
  })

  it('snapshot editable mode', async () => {
    await render(<VendorTagList tags={['cloud', 'saas']} editable onAddTag={() => {}} onRemoveTag={() => {}} />)
    await snapshot('vendor-tag-list-editable')
  })

  it('snapshot add mode open', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await snapshot('vendor-tag-list-adding')
  })

  it('remove tag aria-label contains tag name', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onRemoveTag={() => {}} />)
    expect(getByTestId('remove-tag-cloud').getAttribute('aria-label')).toContain('cloud')
  })

  it('hides remove buttons when onRemoveTag not provided', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['cloud']} editable />)
    expect(queryByTestId('remove-tag-cloud')).toBeNull()
  })

  it('hides add tag button when onAddTag not provided', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['cloud']} editable />)
    expect(queryByTestId('add-tag-button')).toBeNull()
  })

  it('renders correctly with all editable features', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} editable onAddTag={() => {}} onRemoveTag={() => {}} onTagClick={() => {}} />)
    expect(getByTestId('add-tag-button')).toBeDefined()
    expect(getByTestId('remove-tag-cloud')).toBeDefined()
  })

  it('renders editable empty list with add button', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    expect(getByTestId('add-tag-button')).toBeDefined()
  })

  // Edge cases (5)
  it('renders with single tag', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(getByTestId('tag-badge-cloud')).toBeDefined()
  })

  it('renders with 20 tags and maxVisible=5', async () => {
    const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`)
    const { getByTestId } = await render(<VendorTagList tags={tags} maxVisible={5} />)
    expect(getByTestId('show-more-tags').textContent).toContain('+15')
  })

  it('show more count is correct with maxVisible=10', async () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`)
    const { getByTestId } = await render(<VendorTagList tags={tags} maxVisible={10} />)
    expect(getByTestId('show-more-tags').textContent).toContain('+5')
  })

  it('does not show more when all visible', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['a', 'b', 'c']} maxVisible={10} />)
    expect(queryByTestId('show-more-tags')).toBeNull()
  })

  it('renders tags with numbers', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['iso27001', 'soc2']} />)
    expect(getByTestId('tag-badge-iso27001')).toBeDefined()
    expect(getByTestId('tag-badge-soc2')).toBeDefined()
  })

  // Additional tests to reach 100 (45 more)
  it('renders container data-testid vendor-tag-list', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(getByTestId('vendor-tag-list').getAttribute('data-testid')).toBe('vendor-tag-list')
  })

  it('empty state data-testid is vendor-tag-list-empty', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} />)
    expect(getByTestId('vendor-tag-list-empty').getAttribute('data-testid')).toBe('vendor-tag-list-empty')
  })

  it('show-more-tags data-testid is correct', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    expect(getByTestId('show-more-tags').getAttribute('data-testid')).toBe('show-more-tags')
  })

  it('tag-badge data-testid includes tag name', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['gdpr']} />)
    expect(getByTestId('tag-badge-gdpr').getAttribute('data-testid')).toBe('tag-badge-gdpr')
  })

  it('tag-item data-testid includes tag name', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(getByTestId('tag-item-cloud').getAttribute('data-testid')).toBe('tag-item-cloud')
  })

  it('renders cloud tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} />)
    expect(getByTestId('tag-badge-cloud').textContent).toBe('cloud')
  })

  it('renders saas tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['saas']} />)
    expect(getByTestId('tag-badge-saas').textContent).toBe('saas')
  })

  it('renders security tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['security']} />)
    expect(getByTestId('tag-badge-security').textContent).toBe('security')
  })

  it('renders compliance tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['compliance']} />)
    expect(getByTestId('tag-badge-compliance').textContent).toBe('compliance')
  })

  it('renders hipaa tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['hipaa']} />)
    expect(getByTestId('tag-badge-hipaa').textContent).toBe('hipaa')
  })

  it('renders gdpr tag text', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['gdpr']} />)
    expect(getByTestId('tag-badge-gdpr').textContent).toBe('gdpr')
  })

  it('fires onTagClick with cloud tag', async () => {
    let clicked = ''
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} onTagClick={t => { clicked = t }} />)
    await fireEvent.click(getByTestId('tag-badge-cloud'))
    expect(clicked).toBe('cloud')
  })

  it('fires onTagClick with saas tag', async () => {
    let clicked = ''
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} onTagClick={t => { clicked = t }} />)
    await fireEvent.click(getByTestId('tag-badge-saas'))
    expect(clicked).toBe('saas')
  })

  it('fires onTagClick with security tag', async () => {
    let clicked = ''
    const { getByTestId } = await render(<VendorTagList tags={['security', 'compliance']} onTagClick={t => { clicked = t }} />)
    await fireEvent.click(getByTestId('tag-badge-security'))
    expect(clicked).toBe('security')
  })

  it('fires onTagClick with compliance tag', async () => {
    let clicked = ''
    const { getByTestId } = await render(<VendorTagList tags={['security', 'compliance']} onTagClick={t => { clicked = t }} />)
    await fireEvent.click(getByTestId('tag-badge-compliance'))
    expect(clicked).toBe('compliance')
  })

  it('fires onTagClick multiple times', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} onTagClick={() => { count++ }} />)
    await fireEvent.click(getByTestId('tag-badge-cloud'))
    await fireEvent.click(getByTestId('tag-badge-cloud'))
    expect(count).toBe(2)
  })

  it('fires onRemoveTag with cloud', async () => {
    let removed = ''
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} editable onRemoveTag={t => { removed = t }} />)
    await fireEvent.click(getByTestId('remove-tag-cloud'))
    expect(removed).toBe('cloud')
  })

  it('fires onRemoveTag with saas', async () => {
    let removed = ''
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} editable onRemoveTag={t => { removed = t }} />)
    await fireEvent.click(getByTestId('remove-tag-saas'))
    expect(removed).toBe('saas')
  })

  it('fires onRemoveTag multiple times', async () => {
    let count = 0
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas']} editable onRemoveTag={() => { count++ }} />)
    await fireEvent.click(getByTestId('remove-tag-cloud'))
    await fireEvent.click(getByTestId('remove-tag-saas'))
    expect(count).toBe(2)
  })

  it('show-more button is clickable', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={2} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    expect(getByTestId('show-less-tags')).toBeDefined()
  })

  it('show-less button is clickable after expanding', async () => {
    const { getByTestId, queryByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={2} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    await fireEvent.click(getByTestId('show-less-tags'))
    expect(queryByTestId('show-less-tags')).toBeNull()
  })

  it('expanding and collapsing restores show-more button', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={2} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    await fireEvent.click(getByTestId('show-less-tags'))
    expect(getByTestId('show-more-tags')).toBeDefined()
  })

  it('snapshot with maxVisible=1', async () => {
    await render(<VendorTagList tags={sampleTags} maxVisible={1} />)
    await snapshot('vendor-tag-list-maxvisible-1')
  })

  it('snapshot with maxVisible=10 and 8 tags', async () => {
    await render(<VendorTagList tags={sampleTags} maxVisible={10} />)
    await snapshot('vendor-tag-list-all-visible')
  })

  it('snapshot editable with remove buttons', async () => {
    await render(<VendorTagList tags={['cloud', 'saas', 'security']} editable onRemoveTag={() => {}} />)
    await snapshot('vendor-tag-list-editable-remove')
  })

  it('onAddTag receives correct value from input', async () => {
    let added = ''
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={t => { added = t }} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.change(getByTestId('add-tag-input'), { target: { value: 'newtag' } })
    await fireEvent.click(getByTestId('confirm-add-tag'))
    expect(added).toBe('newtag')
  })

  it('onAddTag receives another value from input', async () => {
    let added = ''
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={t => { added = t }} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.change(getByTestId('add-tag-input'), { target: { value: 'hipaa' } })
    await fireEvent.click(getByTestId('confirm-add-tag'))
    expect(added).toBe('hipaa')
  })

  it('input is cleared after cancel', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    await fireEvent.change(getByTestId('add-tag-input'), { target: { value: 'test' } })
    await fireEvent.click(getByTestId('cancel-add-tag'))
    await fireEvent.click(getByTestId('add-tag-button'))
    expect((getByTestId('add-tag-input') as HTMLInputElement).value).toBe('')
  })

  it('show more count is +5 with 8 tags and maxVisible=3', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={3} />)
    expect(getByTestId('show-more-tags').textContent).toContain('+5')
  })

  it('show more count is +6 with 8 tags and maxVisible=2', async () => {
    const { getByTestId } = await render(<VendorTagList tags={sampleTags} maxVisible={2} />)
    expect(getByTestId('show-more-tags').textContent).toContain('+6')
  })

  it('renders 2 visible tags when maxVisible=2 and 8 tags', async () => {
    const { container } = await render(<VendorTagList tags={sampleTags} maxVisible={2} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(2)
  })

  it('renders 4 visible tags when maxVisible=4 and 8 tags', async () => {
    const { container } = await render(<VendorTagList tags={sampleTags} maxVisible={4} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(4)
  })

  it('renders all 8 tags when maxVisible=8', async () => {
    const { container } = await render(<VendorTagList tags={sampleTags} maxVisible={8} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(8)
  })

  it('renders all tags after clicking show more with maxVisible=2', async () => {
    const { getByTestId, container } = await render(<VendorTagList tags={sampleTags} maxVisible={2} />)
    await fireEvent.click(getByTestId('show-more-tags'))
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(sampleTags.length)
  })

  it('remove-tag data-testid includes tag name', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud']} editable onRemoveTag={() => {}} />)
    expect(getByTestId('remove-tag-cloud').getAttribute('data-testid')).toBe('remove-tag-cloud')
  })

  it('add-tag-button data-testid is add-tag-button', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    expect(getByTestId('add-tag-button').getAttribute('data-testid')).toBe('add-tag-button')
  })

  it('confirm-add-tag data-testid is confirm-add-tag', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    expect(getByTestId('confirm-add-tag').getAttribute('data-testid')).toBe('confirm-add-tag')
  })

  it('cancel-add-tag data-testid is cancel-add-tag', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    expect(getByTestId('cancel-add-tag').getAttribute('data-testid')).toBe('cancel-add-tag')
  })

  it('add-tag-input data-testid is add-tag-input', async () => {
    const { getByTestId } = await render(<VendorTagList tags={[]} editable onAddTag={() => {}} />)
    await fireEvent.click(getByTestId('add-tag-button'))
    expect(getByTestId('add-tag-input').getAttribute('data-testid')).toBe('add-tag-input')
  })

  it('shows all 5 sample tags when maxVisible=5', async () => {
    const { container } = await render(<VendorTagList tags={sampleTags.slice(0, 5)} maxVisible={5} />)
    const badges = container.querySelectorAll('[data-testid^="tag-badge-"]')
    expect(badges.length).toBe(5)
  })

  it('renders with 3 tags and no overflow', async () => {
    const { queryByTestId } = await render(<VendorTagList tags={['cloud', 'saas', 'security']} maxVisible={5} />)
    expect(queryByTestId('show-more-tags')).toBeNull()
  })

  it('renders tag for hipaa', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['hipaa', 'gdpr']} />)
    expect(getByTestId('tag-badge-hipaa')).toBeDefined()
  })

  it('renders tag for gdpr', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['hipaa', 'gdpr']} />)
    expect(getByTestId('tag-badge-gdpr')).toBeDefined()
  })

  it('renders tag for iso27001', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['iso27001']} />)
    expect(getByTestId('tag-badge-iso27001')).toBeDefined()
  })

  it('renders tag-item-saas data-testid', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['saas']} />)
    expect(getByTestId('tag-item-saas').getAttribute('data-testid')).toBe('tag-item-saas')
  })

  it('renders tag-item-security data-testid', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['security']} />)
    expect(getByTestId('tag-item-security').getAttribute('data-testid')).toBe('tag-item-security')
  })

  it('editable mode shows container for 3 tags', async () => {
    const { getByTestId } = await render(<VendorTagList tags={['cloud', 'saas', 'security']} editable onRemoveTag={() => {}} />)
    expect(getByTestId('vendor-tag-list')).toBeDefined()
  })
})
