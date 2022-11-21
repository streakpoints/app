import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';

import {
  useHistory,
  Link
} from 'react-router-dom';
import * as data from './data';

import SearchBarWrapper from './SearchBarWrapper';

function PageHeader(props) {
  const [userName, setUserName] = useState('');
  const history = useHistory();

  return (
    <div style={{ paddingBottom: props.fixed ? '4em' : '0' }}>
      <div style={{ position: props.fixed ? 'absolute' : 'static', width: '100%', left: '0' }}>
        <div className='flex' style={{ width: '100%', alignItems: 'center' }}>
          {
            props.fixed &&
            <div className='flex-shrink' style={{ padding: '1em' }}>
              <Link style={{ textDecoration: 'none', fontSize: '1.5em' }} to='/'>🎤</Link>
            </div>
          }
            <div className='flex-grow' style={{ textAlign: 'center', padding: props.fixed ? '0 1em' : '0' }}>
              <SearchBarWrapper>
                <AsyncSelect
                  cacheOptions={false}
                  placeholder='@username'
                  className='search-bar'
                  classNamePrefix='search-bar'
                  defaultOptions={[]}
                  loadOptions={async (inputValue) => {
                    const results = (await data.searchUser({
                      twitterAccountQuery: inputValue.replace('@', '')
                    })).map(r => ({
                      label: `@${r.handle}`,
                      value: r.handle
                    }));
                    if (results.length === 0) {
                      return [{ label: `@${inputValue}`, value: inputValue }];
                    }
                    if (results[0].value.toLowerCase() !== inputValue.toLowerCase()) {
                      results.unshift({ label: `@${inputValue}`, value: inputValue });
                    }
                    return results;
                  }}
                  components={{
                    ClearIndicator: () => null,
                    IndicatorSeparator: () => null,
                    DropdownIndicator: () => null,
                    MenuList: props => (<div className='search-bar__menu-list'>{props.children}</div>)
                  }}
                  value={userName}
                  inputValue={userName}
                  onInputChange={(newValue, meta) => {
                    if (meta.action === 'input-change') {
                      setUserName(newValue);
                    }
                  }}
                  onChange={async (newValue, meta) => {
                    if (meta.action === 'select-option') {
                      setUserName('');
                      history.push(`/${newValue.value}`);
                    }
                  }}
                />
              </SearchBarWrapper>
            </div>
          {
            props.fixed &&
            <div className='flex-shrink' style={{ padding: '1em' }}>
              <Link style={{ textDecoration: 'none', fontSize: '1.5em' }} to='/i'>⚙️</Link>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
