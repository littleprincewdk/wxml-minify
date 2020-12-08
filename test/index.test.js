const minify = require('../lib');

test('treat empty content as single tag', () => {
  const fixture = '<view></view>';
  const expected = '<view/>';

  expect(minify(fixture)).toBe(expected);
});

test('remove \\n between tag', () => {
  const fixture = `<view />
  <view />`;
  const expected = '<view/><view/>';

  expect(minify(fixture)).toBe(expected);
});

test('remove comment', () => {
  const fixture = `<!-- comment --><view />`;
  const expected = '<view/>';

  expect(minify(fixture)).toBe(expected);
});

test('minify js expression - 1', () => {
  const fixture = `<view wx:if="{{a && b}}" />`;
  const expected = `<view wx:if="{{a&&b}}"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('minify js expression - 2', () => {
  const fixture = `<view wx:if="{{a || b}}" />`;
  const expected = `<view wx:if="{{a||b}}"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('minify js expression - 3', () => {
  const fixture = `<view wx:if="{{a ? b : c}}" />`;
  const expected = `<view wx:if="{{a?b:c}}"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('minify js expression - 4', () => {
  const fixture = `<view class="{{a ? 'b' : 'c'}}" />`;
  const expected = `<view class="{{a?'b':'c'}}"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('minify js expression - 5', () => {
  const fixture = `<view>{{a ? 'b' : 'c'}}</view>`;
  const expected = `<view>{{a?'b':'c'}}</view>`;

  expect(minify(fixture)).toBe(expected);
});

test('fix jsmin bug: 除以数字的表达式数字丢失 - 1', () => {
  const fixture = `<view a="b / 4"/>`;
  const expected = `<view a="b / 4"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('fix jsmin bug: 除以数字的表达式数字丢失 - 2', () => {
  const fixture = `<view a="b / 0.4"/>`;
  const expected = `<view a="b / 0.4"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('remove space between attributes - 1', () => {
  const fixture = `<view a="a" b="b" />`;
  const expected = `<view a="a"b="b"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('remove space between attributes - 2', () => {
  const fixture = `<view a="a" c b="b" />`;
  const expected = `<view a="a" c b="b"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('remove space between attributes - 3', () => {
  const fixture = `<view c a="a" b="b" />`;
  const expected = `<view c a="a"b="b"/>`;

  expect(minify(fixture)).toBe(expected);
});

test('remove space between attributes - 4', () => {
  const fixture = `<view a="a" b="b" c />`;
  const expected = `<view a="a"b="b" c/>`;

  expect(minify(fixture)).toBe(expected);
});

test('mix', () => {
  const fixture = `<view class="{{a ? 'b' : 'c'}}">
  <!-- comment -->
  <view wx:if="{{a && b}}">hello</view>
  <view wx:else">world</view>
  <image class="d" id="e" lazy-load />
</view>
`;
  const expected = `<view class="{{a?'b':'c'}}"><view wx:if="{{a&&b}}">hello</view><view wx:else">world</view><image class="d"id="e" lazy-load/></view>`;

  expect(minify(fixture)).toBe(expected);
});
